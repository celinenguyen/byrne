import { defineMiddleware } from 'astro:middleware';
import { getSessionUser, isOwner, ownerGithubUserId, type SessionUser } from './lib/auth';

/**
 * The single chokepoint for edit access.
 *
 * Every mutating `/api/*` request passes through here, so new endpoints are
 * protected by default rather than by remembering to protect them. The UI
 * hiding an edit button is cosmetic; *this* is the actual gate.
 *
 * The index page renders on demand so it can hand `locals.canEdit` to the
 * client (see src/pages/index.astro).
 */

/**
 * In local development there's no OAuth app and no session cookie, so we treat
 * the local user as the owner. This keeps `npm run dev` working exactly as it
 * did before auth existed — edits go straight to `data/` on disk.
 *
 * This is safe because it's compiled out of the production build: Astro
 * statically replaces `import.meta.env.DEV` with `false` when building, so the
 * bypass isn't merely unreachable in production, it isn't present at all.
 */
const DEV_USER: SessionUser = {
  id: ownerGithubUserId(),
  login: 'local-dev',
  avatarUrl: '',
};

/**
 * Auth routes are exempt from the owner check — you have to be able to start
 * a login, and to clear a session that's already invalid.
 */
const AUTH_ROUTE_PREFIX = '/api/auth/';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request, cookies, locals, isPrerendered } = context;

  if (isPrerendered) {
    // Prerendered routes are rendered once at build time, so there's no
    // visitor and no cookies to read — reading them here would resolve one
    // build-time identity and bake it into the HTML for everyone.
    locals.user = null;
    locals.canEdit = false;
    return next();
  }

  if (import.meta.env.DEV) {
    locals.user = DEV_USER;
    locals.canEdit = true;
  } else {
    const user = await getSessionUser(cookies);
    locals.user = user;
    locals.canEdit = isOwner(user);
  }

  const isApiRoute = url.pathname.startsWith('/api/');
  const isAuthRoute = url.pathname.startsWith(AUTH_ROUTE_PREFIX);
  // GET and HEAD are reads. Everything else changes something — including the
  // POST-based `fetch-meta` and `fetch-arena` routes, which would otherwise be
  // an open URL-fetching proxy sitting on a public domain.
  const isMutating = request.method !== 'GET' && request.method !== 'HEAD';

  if (isApiRoute && !isAuthRoute && isMutating && !locals.canEdit) {
    return new Response(
      JSON.stringify({ error: 'Editing is restricted to the deck owner.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return next();
});
