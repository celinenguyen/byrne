import type { APIRoute } from 'astro';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DECK_PATH = join(process.cwd(), 'data', 'deck.json');

export const GET: APIRoute = async () => {
  try {
    const raw = await readFile(DECK_PATH, 'utf-8');
    return new Response(raw, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(
      JSON.stringify({
        meta: {
          title: 'Year in Review 2026',
          author: '',
          startDate: '',
          endDate: '',
        },
        slides: [],
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    await writeFile(DECK_PATH, JSON.stringify(body, null, 2), 'utf-8');
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
