import type { APIRoute } from 'astro';
import {
  clearOAuthStateCookie,
  isOwner,
  OAUTH_STATE_COOKIE,
  requireEnv,
  setSessionCookie,
  signSession,
  type SessionUser,
} from '../../../lib/auth';

export const prerender = false;

function decodeReturnTo(encoded: string | undefined): string {
  if (!encoded) return '/';
  try {
    const path = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    return path.startsWith('/') && !path.startsWith('//') ? path : '/';
  } catch {
    return '/';
  }
}

/**
 * Complete the OAuth round-trip.
 *
 * Order matters here: validate `state` *before* spending the code, so a forged
 * callback never reaches GitHub's token endpoint.
 */
export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expectedRandom = cookies.get(OAUTH_STATE_COOKIE)?.value;

  // The state cookie is single-use regardless of how this turns out.
  clearOAuthStateCookie(cookies);

  if (!code || !state || !expectedRandom) {
    return redirect('/?authError=invalid-request', 302);
  }

  const [random, encodedReturn] = state.split('.');
  if (random !== expectedRandom) {
    return redirect('/?authError=state-mismatch', 302);
  }
  const returnTo = decodeReturnTo(encodedReturn);

  // Exchange the code for an access token.
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: requireEnv('GITHUB_CLIENT_ID'),
      client_secret: requireEnv('GITHUB_CLIENT_SECRET'),
      code,
      redirect_uri: new URL('/api/auth/callback', url.origin).toString(),
    }),
  });

  if (!tokenRes.ok) {
    return redirect('/?authError=token-exchange-failed', 302);
  }

  const tokenBody = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenBody.access_token) {
    return redirect('/?authError=token-exchange-failed', 302);
  }

  // Identify the account behind that token.
  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenBody.access_token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'byrne-slide-decks',
    },
  });

  if (!userRes.ok) {
    return redirect('/?authError=profile-fetch-failed', 302);
  }

  const profile = (await userRes.json()) as {
    id: number;
    login: string;
    avatar_url: string;
  };

  const user: SessionUser = {
    id: profile.id,
    login: profile.login,
    avatarUrl: profile.avatar_url,
  };

  // Signing in as someone else is a perfectly normal thing to do — it just
  // doesn't grant edit access. No session cookie is issued, so they get the
  // same read-only experience as a signed-out visitor.
  if (!isOwner(user)) {
    return redirect('/?authError=not-owner', 302);
  }

  const token = await signSession(user, requireEnv('SESSION_SECRET'));
  setSessionCookie(cookies, token);

  return redirect(returnTo, 302);
};
