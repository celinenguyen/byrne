import { readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Deck, DeckSummary } from '../types';
import { summarize, type DeckStorage, type StoredDeck, type WriteOptions } from './types';

const DATA_DIR = join(process.cwd(), 'data');

function pathFor(filename: string): string {
  return join(DATA_DIR, `${filename}.json`);
}

/**
 * Decks on the local filesystem — what `npm run dev` uses.
 *
 * This is the original behavior, preserved so local development is unaffected
 * by decks moving to GitHub in production. There's no version marker, so
 * `sha` is always undefined and writes are last-one-wins.
 */
export const fsStorage: DeckStorage = {
  async listFilenames(): Promise<string[]> {
    const files = await readdir(DATA_DIR);
    return files.filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
  },

  async list(): Promise<DeckSummary[]> {
    const filenames = await this.listFilenames();
    const summaries = await Promise.all(
      filenames.map(async (filename) => {
        const raw = await readFile(pathFor(filename), 'utf-8');
        return summarize(JSON.parse(raw) as Deck, filename);
      })
    );
    return summaries;
  },

  async read(filename: string): Promise<StoredDeck | null> {
    try {
      const raw = await readFile(pathFor(filename), 'utf-8');
      return { deck: JSON.parse(raw) as Deck };
    } catch {
      return null;
    }
  },

  async write(filename: string, deck: Deck, _options?: WriteOptions): Promise<{ sha?: string }> {
    await writeFile(pathFor(filename), JSON.stringify(deck, null, 2), 'utf-8');
    return {};
  },

  async remove(filename: string): Promise<void> {
    await unlink(pathFor(filename));
  },
};
