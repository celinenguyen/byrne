import type { APIRoute } from 'astro';
import type { Deck } from '../../lib/types';
import { DeckConflictError, getDeckStorage } from '../../lib/storage';

export const prerender = false;

/**
 * Single-deck read and write.
 *
 * Anyone can read a published deck. Drafts are owner-only: to everyone else a
 * draft is indistinguishable from a deck that doesn't exist. Writes are
 * owner-only, enforced by the middleware and again here.
 */

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function resolveFilename(url: URL): string | null {
  const slug = url.searchParams.get('file') || 'deck';
  // Reject path traversal
  if (slug.includes('..') || slug.includes('/') || slug.includes('\\')) {
    return null;
  }
  return slug;
}

export const GET: APIRoute = async ({ url, locals }) => {
  const filename = resolveFilename(url);
  if (!filename) {
    return json({ error: 'Invalid file parameter' }, 400);
  }

  try {
    const stored = await (await getDeckStorage()).read(filename);

    if (!locals.canEdit) {
      if (!stored || stored.deck.meta?.status !== 'published') {
        return json({ error: 'Not found' }, 404);
      }
      return json(stored.deck, 200, { 'Cache-Control': 'no-store' });
    }

    if (!stored) {
      return json({
        meta: { id: 'default', title: 'New Deck', author: '' },
        slides: [],
      });
    }
    // The version marker rides in a header rather than the body so the deck
    // JSON stays exactly what gets stored. Clients can hand it back on PUT to
    // detect a conflicting edit.
    return json(stored.deck, 200, {
      'Cache-Control': 'no-store, private',
      ...(stored.sha ? { 'X-Deck-Sha': stored.sha } : {}),
    });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
};

export const PUT: APIRoute = async ({ request, url, locals }) => {
  if (!locals.canEdit) {
    return json({ error: 'Editing is restricted to the deck owner.' }, 401);
  }

  const filename = resolveFilename(url);
  if (!filename) {
    return json({ error: 'Invalid file parameter' }, 400);
  }

  try {
    const body = (await request.json()) as Deck;
    // Stamp updatedAt on every save
    if (body.meta) body.meta.updatedAt = new Date().toISOString();

    // Optional optimistic lock — absent means last-one-wins, which is the
    // current client behavior.
    const sha = request.headers.get('X-Deck-Sha') ?? undefined;

    const result = await (await getDeckStorage()).write(filename, body, { sha });
    return json({ ok: true, sha: result.sha }, 200, result.sha ? { 'X-Deck-Sha': result.sha } : {});
  } catch (err) {
    if (err instanceof DeckConflictError) {
      return json({ error: err.message, conflict: true }, 409);
    }
    return json({ error: String(err) }, 500);
  }
};
