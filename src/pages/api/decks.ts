import type { APIRoute } from 'astro';
import { nanoid } from 'nanoid';
import { slugify } from '../../lib/slugify';
import { generateDeckId } from '../../lib/id';
import type { Deck } from '../../lib/types';
import { DeckConflictError, getDeckStorage } from '../../lib/storage';

export const prerender = false;

/**
 * Deck collection: list, create, rename, delete.
 *
 * All methods are owner-only — the list includes drafts, so it must not be
 * public. Visitors get the published-only manifest from `public/decks/`.
 */

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isUnsafeFilename(filename: string): boolean {
  return filename.includes('..') || filename.includes('/') || filename.includes('\\');
}

/** Pick a filename derived from `title` that doesn't collide with an existing deck. */
function uniqueFilename(title: string, taken: string[], allow?: string): string {
  const base = slugify(title) || 'untitled';
  let candidate = base;
  let counter = 2;
  while (taken.includes(candidate) && candidate !== allow) {
    candidate = `${base}-${counter}`;
    counter++;
  }
  return candidate;
}

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.canEdit) {
    return json({ error: 'Not found' }, 404);
  }

  try {
    return json(await getDeckStorage().list());
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { title } = (await request.json()) as { title?: string };
    if (!title || typeof title !== 'string') {
      return json({ error: 'title is required' }, 400);
    }

    const storage = getDeckStorage();
    const id = generateDeckId();
    const now = new Date().toISOString();
    const filename = uniqueFilename(title, await storage.listFilenames());

    const deck: Deck = {
      meta: {
        id,
        title,
        author: '',
        updatedAt: now,
        // New decks start as drafts, so nothing reaches the public build until
        // it's explicitly published.
        status: 'draft',
      },
      slides: [
        {
          id: nanoid(),
          order: 0,
          layout: 'Title',
          content: { images: [], text: [title], url: '' },
        },
      ],
    };

    await storage.write(filename, deck, { message: `Create deck: ${title}` });

    return json({ id, title, filename, updatedAt: now, slideCount: 1, status: 'draft' });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
};

/** PATCH — rename a deck (update title and filename) */
export const PATCH: APIRoute = async ({ request }) => {
  try {
    const { currentFilename, newTitle } = (await request.json()) as {
      currentFilename?: string;
      newTitle?: string;
    };
    if (!currentFilename || !newTitle || typeof newTitle !== 'string') {
      return json({ error: 'currentFilename and newTitle are required' }, 400);
    }
    if (isUnsafeFilename(currentFilename)) {
      return json({ error: 'Invalid filename' }, 400);
    }

    const storage = getDeckStorage();
    const stored = await storage.read(currentFilename);
    if (!stored) {
      return json({ error: 'Deck not found' }, 404);
    }

    const deck = stored.deck;
    deck.meta.title = newTitle;
    deck.meta.updatedAt = new Date().toISOString();

    const newFilename = uniqueFilename(
      newTitle,
      await storage.listFilenames(),
      currentFilename
    );

    if (newFilename === currentFilename) {
      await storage.write(currentFilename, deck, {
        sha: stored.sha,
        message: `Rename deck: ${newTitle}`,
      });
    } else {
      // Write the new path before removing the old one, so a failure between
      // the two leaves a duplicate rather than losing the deck. On the GitHub
      // backend this is two commits; a single-commit rename would need the Git
      // Trees API.
      await storage.write(newFilename, deck, { message: `Rename deck: ${newTitle}` });
      await storage.remove(currentFilename, { message: `Rename deck: ${newTitle}` });
    }

    return json({ title: newTitle, filename: newFilename });
  } catch (err) {
    if (err instanceof DeckConflictError) {
      return json({ error: err.message, conflict: true }, 409);
    }
    return json({ error: String(err) }, 500);
  }
};

/** DELETE — delete a deck by filename */
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { filename } = (await request.json()) as { filename?: string };
    if (!filename || typeof filename !== 'string') {
      return json({ error: 'filename is required' }, 400);
    }
    if (isUnsafeFilename(filename)) {
      return json({ error: 'Invalid filename' }, 400);
    }

    await getDeckStorage().remove(filename);
    return json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('ENOENT') || (err as Error)?.name === 'DeckNotFoundError') {
      return json({ error: 'Deck not found' }, 404);
    }
    return json({ error: String(err) }, 500);
  }
};
