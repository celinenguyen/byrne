import { env } from 'cloudflare:workers';
import type { Deck, DeckSummary } from '../types';
import { DeckConflictError, summarize, type DeckStorage, type StoredDeck, type WriteOptions } from './types';

/**
 * Decks and uploaded images in Cloudflare R2 — what the deployed Worker uses.
 *
 * Layout inside the `byrne-decks` bucket (binding `DECKS`, see wrangler.jsonc):
 *
 *   decks/<filename>.json   deck JSON, same contents as data/<filename>.json
 *   images/<name>.<ext>     uploads, served at /images/<name>.<ext>
 *
 * This module imports `cloudflare:workers`, which only exists inside the
 * Worker, so it must only ever be loaded with a dynamic import outside dev
 * (see ./index.ts).
 */

// Only the parts of the R2 API used here, so this doesn't need
// @cloudflare/workers-types.
interface R2Object {
  key: string;
  etag: string;
}
interface R2ObjectBody extends R2Object {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
  json<T>(): Promise<T>;
}
interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
  put(
    key: string,
    value: string | ArrayBuffer | ReadableStream,
    options?: {
      httpMetadata?: { contentType?: string; cacheControl?: string };
      onlyIf?: { etagMatches?: string };
    }
  ): Promise<R2Object | null>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; cursor?: string }): Promise<{
    objects: R2Object[];
    truncated: boolean;
    cursor?: string;
  }>;
}

export function bucket(): R2Bucket {
  const binding = (env as Record<string, unknown>).DECKS;
  if (!binding) {
    throw new Error('The DECKS R2 bucket binding is missing. See wrangler.jsonc.');
  }
  return binding as R2Bucket;
}

const DECK_PREFIX = 'decks/';
export const IMAGE_PREFIX = 'images/';

function keyFor(filename: string): string {
  return `${DECK_PREFIX}${filename}.json`;
}

export const r2Storage: DeckStorage = {
  async listFilenames(): Promise<string[]> {
    const filenames: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await bucket().list({ prefix: DECK_PREFIX, cursor });
      for (const obj of page.objects) {
        if (obj.key.endsWith('.json')) {
          filenames.push(obj.key.slice(DECK_PREFIX.length, -'.json'.length));
        }
      }
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);
    return filenames;
  },

  async list(): Promise<DeckSummary[]> {
    const filenames = await this.listFilenames();
    const decks = await Promise.all(filenames.map((f) => this.read(f)));
    return decks.flatMap((stored, i) => (stored ? [summarize(stored.deck, filenames[i])] : []));
  },

  async read(filename: string): Promise<StoredDeck | null> {
    const obj = await bucket().get(keyFor(filename));
    if (!obj) return null;
    return { deck: await obj.json<Deck>(), sha: obj.etag };
  },

  async write(filename: string, deck: Deck, options?: WriteOptions): Promise<{ sha?: string }> {
    const result = await bucket().put(keyFor(filename), JSON.stringify(deck, null, 2), {
      httpMetadata: { contentType: 'application/json' },
      ...(options?.sha ? { onlyIf: { etagMatches: options.sha } } : {}),
    });
    // R2 returns null when an `onlyIf` precondition fails.
    if (!result) throw new DeckConflictError();
    return { sha: result.etag };
  },

  async remove(filename: string): Promise<void> {
    await bucket().delete(keyFor(filename));
  },
};
