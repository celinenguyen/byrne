import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * Who am I?
 *
 * The index page is `client:only`, so the Svelte app can't read `locals` at
 * render time — it asks this endpoint on boot instead. Middleware has already
 * resolved the session by the time this runs.
 *
 * `canEdit` is the field the UI should branch on. `user` may be non-null while
 * `canEdit` is false in dev, and is the source for the avatar/login display.
 */
export const GET: APIRoute = async ({ locals }) => {
  return new Response(
    JSON.stringify({
      user: locals.user,
      canEdit: locals.canEdit,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        // Never let a CDN or browser cache one visitor's identity for another.
        'Cache-Control': 'no-store, private',
      },
    }
  );
};
