import type { APIRoute } from 'astro';
import { nanoid } from 'nanoid';

export const prerender = false;

const MAX_BYTES = 25 * 1024 * 1024;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Store an uploaded image and return the path to reference it by.
 *
 * Either way the path is `/images/<name>`: in dev the file lands in
 * `public/images/`, and in the Worker it goes to R2 under `images/`, where
 * src/pages/images/[...path].ts serves it. Owner-only via the middleware.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return json({ error: 'No file provided' }, 400);
    }
    if (!file.type.startsWith('image/')) {
      return json({ error: 'Only images can be uploaded' }, 400);
    }
    if (file.size > MAX_BYTES) {
      return json({ error: 'Images must be 25 MB or smaller' }, 413);
    }

    const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
    const filename = `${nanoid(10)}.${ext}`;

    if (import.meta.env.DEV) {
      const { mkdir, writeFile } = await import('node:fs/promises');
      const { join } = await import('node:path');
      const imagesDir = join(process.cwd(), 'public', 'images');
      await mkdir(imagesDir, { recursive: true });
      await writeFile(join(imagesDir, filename), Buffer.from(await file.arrayBuffer()));
    } else {
      const { bucket, IMAGE_PREFIX } = await import('../../lib/storage/r2');
      await bucket().put(`${IMAGE_PREFIX}${filename}`, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type },
      });
    }

    return json({ path: `/images/${filename}` });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
};
