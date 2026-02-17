import type { APIRoute } from 'astro';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DATA_DIR = join(process.cwd(), 'data');

function resolveDeckPath(url: URL): string | null {
  const slug = url.searchParams.get('file') || 'deck';
  // Reject path traversal
  if (slug.includes('..') || slug.includes('/') || slug.includes('\\')) {
    return null;
  }
  return join(DATA_DIR, slug + '.json');
}

export const GET: APIRoute = async ({ url }) => {
  const deckPath = resolveDeckPath(url);
  if (!deckPath) {
    return new Response(JSON.stringify({ error: 'Invalid file parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const raw = await readFile(deckPath, 'utf-8');
    return new Response(raw, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(
      JSON.stringify({
        meta: {
          id: 'default',
          title: 'New Deck',
          author: '',
        },
        slides: [],
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const PUT: APIRoute = async ({ request, url }) => {
  const deckPath = resolveDeckPath(url);
  if (!deckPath) {
    return new Response(JSON.stringify({ error: 'Invalid file parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    // Stamp updatedAt on every save
    if (body.meta) body.meta.updatedAt = new Date().toISOString();
    await writeFile(deckPath, JSON.stringify(body, null, 2), 'utf-8');
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
