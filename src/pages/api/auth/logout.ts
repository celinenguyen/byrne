import type { APIRoute } from 'astro';
import { clearSessionCookie } from '../../../lib/auth';

export const prerender = false;

/**
 * Sign out.
 *
 * POST rather than GET so a stray link or prefetch can't log you out. The
 * middleware exempts `/api/auth/*` from the owner check, since you need to be
 * able to clear a session that's already invalid.
 */
export const POST: APIRoute = async ({ cookies }) => {
  clearSessionCookie(cookies);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
