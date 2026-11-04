import type { APIRoute } from 'astro';
import { requireEnv, setOAuthStateCookie } from '../../../lib/auth';

export const prerender = false;

/**
 * Start the GitHub OAuth round-trip.
 *
 * The `state` parameter is what stops login CSRF: we mint a random value,
 * stash it in a short-lived cookie, and require GitHub to echo it back. An
 * attacker can send you to a callback URL, but they can't set that cookie in
 * your browser, so the echoed value won't match.
 *
 * The page to return to after signing in rides along in the same parameter as
 * `<random>.<base64url(path)>` — GitHub echoes `state` verbatim, so this saves
 * a second cookie. The callback validates the path before redirecting to it.
 */
export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const clientId = requireEnv('GITHUB_CLIENT_ID');

  const random = crypto.randomUUID();
  setOAuthStateCookie(cookies, random);

  // Only same-site paths are allowed back, so this can't become an open redirect.
  const requested = url.searchParams.get('returnTo') ?? '/';
  const returnTo = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/';
  const encodedReturn = btoa(returnTo).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', clientId);
  authorize.searchParams.set('redirect_uri', new URL('/api/auth/callback', url.origin).toString());
  // `read:user` is all we need — this token only establishes identity. Commits
  // are made with a separate server-side PAT.
  authorize.searchParams.set('scope', 'read:user');
  authorize.searchParams.set('state', `${random}.${encodedReturn}`);

  return redirect(authorize.toString(), 302);
};
