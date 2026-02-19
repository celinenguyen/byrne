import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing url' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse block ID from Are.na URL: https://www.are.na/block/12345
    const match = url.match(/are\.na\/block\/(\d+)/);
    if (!match) {
      return new Response(JSON.stringify({ error: 'Could not parse Are.na block ID from URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const blockId = match[1];
    const res = await fetch(`https://api.are.na/v2/blocks/${blockId}`);
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Are.na API returned ${res.status}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const block = await res.json();

    const image = block.image?.display?.url || block.image?.original?.url || '';
    const title = block.title || '';
    const description = block.description || '';
    // Get the first connected channel name if available
    const channel = block.connections?.[0]?.title || '';
    const blockClass = block.class || '';
    const content = block.content || '';

    return new Response(JSON.stringify({ title, image, description, channel, class: blockClass, content }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
