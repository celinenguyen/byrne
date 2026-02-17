import type { APIRoute } from 'astro';
import { readFile, readdir, writeFile, rename, unlink } from 'node:fs/promises';
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
          updatedAt: data.meta?.updatedAt ?? '',
          slideCount: data.slides?.length ?? 0,
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
    const now = new Date().toISOString();
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
        updatedAt: now,
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

    await writeFile(join(DATA_DIR, filename + '.json'), JSON.stringify(deck, null, 2), 'utf-8');

    return new Response(
      JSON.stringify({ id, title, filename, updatedAt: now, slideCount: 1 }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/** PATCH — rename a deck (update title and filename) */
export const PATCH: APIRoute = async ({ request }) => {
  try {
    const { currentFilename, newTitle } = await request.json();
    if (!currentFilename || !newTitle || typeof newTitle !== 'string') {
      return new Response(JSON.stringify({ error: 'currentFilename and newTitle are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate current filename
    if (currentFilename.includes('..') || currentFilename.includes('/') || currentFilename.includes('\\')) {
      return new Response(JSON.stringify({ error: 'Invalid filename' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const oldPath = join(DATA_DIR, currentFilename + '.json');
    const raw = await readFile(oldPath, 'utf-8');
    const data = JSON.parse(raw);

    // Update the title and updatedAt in meta
    data.meta.title = newTitle;
    data.meta.updatedAt = new Date().toISOString();

    // Compute new filename
    let newFilename = slugify(newTitle);
    if (!newFilename) newFilename = 'untitled';

    // If filename changed, check for collisions and rename the file
    if (newFilename !== currentFilename) {
      const existing = await readdir(DATA_DIR);
      let candidate = newFilename;
      let counter = 2;
      while (existing.includes(candidate + '.json') && candidate !== currentFilename) {
        candidate = `${newFilename}-${counter}`;
        counter++;
      }
      newFilename = candidate;

      await writeFile(oldPath, JSON.stringify(data, null, 2), 'utf-8');
      const newPath = join(DATA_DIR, newFilename + '.json');
      await rename(oldPath, newPath);
    } else {
      await writeFile(oldPath, JSON.stringify(data, null, 2), 'utf-8');
    }

    return new Response(
      JSON.stringify({ title: newTitle, filename: newFilename }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/** DELETE — delete a deck by filename */
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { filename } = await request.json();
    if (!filename || typeof filename !== 'string') {
      return new Response(JSON.stringify({ error: 'filename is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return new Response(JSON.stringify({ error: 'Invalid filename' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const filePath = join(DATA_DIR, filename + '.json');
    await unlink(filePath);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('ENOENT')) {
      return new Response(JSON.stringify({ error: 'Deck not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
