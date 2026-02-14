import type { APIRoute } from 'astro';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { nanoid } from 'nanoid';
import { slugify } from '../../lib/slugify';

const DATA_DIR = join(process.cwd(), 'data');

export const GET: APIRoute = async () => {
  try {
    const files = await readdir(DATA_DIR);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    const summaries = await Promise.all(
      jsonFiles.map(async (f) => {
        const raw = await readFile(join(DATA_DIR, f), 'utf-8');
        const data = JSON.parse(raw);
        const filename = f.replace(/\.json$/, '');
        return {
          id: data.meta?.id ?? filename,
          title: data.meta?.title ?? filename,
          filename,
        };
      })
    );

    return new Response(JSON.stringify(summaries), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { title } = await request.json();
    if (!title || typeof title !== 'string') {
      return new Response(JSON.stringify({ error: 'title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = nanoid();
    let filename = slugify(title);
    if (!filename) filename = 'untitled';

    // Avoid filename collisions
    const existing = await readdir(DATA_DIR);
    let candidate = filename;
    let counter = 2;
    while (existing.includes(candidate + '.json')) {
      candidate = `${filename}-${counter}`;
      counter++;
    }
    filename = candidate;

    const deck = {
      meta: {
        id,
        title,
        author: '',
        startDate: '',
        endDate: '',
      },
      slides: [
        {
          id: nanoid(),
          order: 0,
          layout: 'Title',
          data: { images: [], text: [title], url: '' },
        },
      ],
    };

    await writeFile(join(DATA_DIR, filename + '.json'), JSON.stringify(deck, null, 2), 'utf-8');

    return new Response(
      JSON.stringify({ id, title, filename }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
