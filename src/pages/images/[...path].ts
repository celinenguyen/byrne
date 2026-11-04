import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * Serve images uploaded to R2.
 *
 * Images committed to `public/images/` are static assets, which Cloudflare
 * serves before the Worker runs, so this only sees paths that aren't in the
 * build — i.e. uploads made on the deployed site. In dev, Vite serves
 * `public/` and uploads land there too, so a miss here is a real 404.
 */
export const GET: APIRoute = async ({ params }) => {
  const path = params.path ?? '';
  if (import.meta.env.DEV || !path || path.includes('..') || path.includes('\\')) {
    return new Response('Not found', { status: 404 });
  }

  const { bucket, IMAGE_PREFIX } = await import('../../lib/storage/r2');
  const obj = await bucket().get(`${IMAGE_PREFIX}${path}`);
  if (!obj) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(obj.body, {
    headers: {
      'Content-Type': obj.httpMetadata?.contentType ?? 'application/octet-stream',
      ETag: obj.etag,
      // Upload names are random and never reused, so the bytes behind a URL
      // never change.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
