import type { APIRoute } from 'astro';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { nanoid } from 'nanoid';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ext = file.name.split('.').pop() || 'png';
    const filename = `${nanoid(10)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const outputPath = join(process.cwd(), 'public', 'images', filename);
    await writeFile(outputPath, buffer);

    return new Response(
      JSON.stringify({ path: `/images/${filename}` }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
