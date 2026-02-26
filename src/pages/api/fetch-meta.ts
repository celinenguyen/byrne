import type { APIRoute } from 'astro';

export const prerender = false;

function extractMeta(html: string, property: string): string {
  // Match <meta property="og:..." content="..."> or <meta name="og:..." content="...">
  const regex = new RegExp(
    `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`,
    'i'
  );
  const match = html.match(regex);
  if (match) return match[1];

  // Also try content before property (some sites order attributes differently)
  const regex2 = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
    'i'
  );
  const match2 = html.match(regex2);
  return match2 ? match2[1] : '';
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing url' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; YearInReview/1.0)',
      },
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Fetch returned ${res.status}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const html = await res.text();

    const title = extractMeta(html, 'og:title');
    const description = extractMeta(html, 'og:description');
    const image = extractMeta(html, 'og:image');
    const siteName = extractMeta(html, 'og:site_name');

    return new Response(JSON.stringify({ title, description, image, siteName }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
