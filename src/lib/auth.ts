import type { AstroCookies } from 'astro';

/**
 * Session handling for owner-only deck editing.
 *
 * The GitHub **OAuth app** (`GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`) only
 * proves *who you are*. It asks for `read:user` and nothing more. Decks live
 * in Cloudflare R2 and are written through the Worker's bucket binding, so no
 * GitHub credential can write them, and a stolen session can only call this
 * app's own endpoints.
 */

/**
 * The GitHub account allowed to edit decks.
 *
 * **1417844 is @celinenguyen.**
 *
 * We match on the *numeric id*, never on the login string. GitHub logins are
 * mutable, and a released username can be re-registered by someone else — so
 * comparing against the string "celinenguyen" would mean that renaming the
 * account hands edit access to whoever claims the old handle. The numeric id
 * is permanent, so it's the only safe thing to compare.
 *
 * To point this at a different account, fetch `https://api.github.com/users/<login>`
 * and read `id`. Making this properly multi-user is tracked in issue #35.
 */
const DEFAULT_OWNER_GITHUB_USER_ID = 1417844;

/** How long a signed-in session stays valid. */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/** How long the OAuth round-trip has to complete before its state expires. */
export const OAUTH_STATE_MAX_AGE_SECONDS = 60 * 10; // 10 minutes

/**
 * Cookies use the `__Host-` prefix in production, which the browser only
 * accepts when the cookie is Secure, Path=/, and has no Domain — that stops
 * any subdomain from writing a cookie we'd then trust. The prefix is dropped
 * in dev so the flow can still be exercised over plain http://localhost.
 */
const isProd = import.meta.env.PROD;
const prefix = isProd ? '__Host-' : '';

export const SESSION_COOKIE = `${prefix}byrne_session`;
export const OAUTH_STATE_COOKIE = `${prefix}byrne_oauth_state`;

export interface SessionUser {
  id: number;
  login: string;
  avatarUrl: string;
}

interface SessionPayload extends SessionUser {
  /** Expiry, as a Unix timestamp in seconds. */
  exp: number;
}

/**
 * Read a runtime secret.
 *
 * `process.env` is checked first because Cloudflare Workers populate it with the
 * Worker's vars and secrets (via `nodejs_compat`); `import.meta.env` covers
 * `astro dev`.
 */
export function readEnv(key: string): string | undefined {
  const fromProcess =
    typeof process !== 'undefined' ? process.env?.[key] : undefined;
  return fromProcess ?? (import.meta.env as Record<string, string | undefined>)[key];
}

export function requireEnv(key: string): string {
  const value = readEnv(key);
  if (!value) {
    throw new Error(
      `Missing required environment variable ${key}. See .env.example for the full list.`
    );
  }
  return value;
}

/** The numeric GitHub id permitted to edit, overridable per-deployment. */
export function ownerGithubUserId(): number {
  const override = readEnv('ALLOWED_GITHUB_USER_ID');
  return override ? Number(override) : DEFAULT_OWNER_GITHUB_USER_ID;
}

export function isOwner(user: SessionUser | null): boolean {
  return user !== null && user.id === ownerGithubUserId();
}

// --- Signing ---

const encoder = new TextEncoder();

function base64urlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Produce a `<payload>.<signature>` token.
 *
 * The payload is readable by anyone holding the cookie — that's fine, it only
 * contains a public GitHub profile. What matters is that it can't be *forged*:
 * anyone can write a cookie claiming to be user 1417844, but without
 * SESSION_SECRET they can't produce a signature that verifies.
 */
export async function signSession(user: SessionUser, secret: string): Promise<string> {
  const payload: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encoded = base64urlEncode(encoder.encode(JSON.stringify(payload)));
  const key = await importKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(encoded));
  return `${encoded}.${base64urlEncode(new Uint8Array(signature))}`;
}

/** Verify a token's signature and expiry. Returns null for anything invalid. */
export async function verifySession(
  token: string,
  secret: string
): Promise<SessionUser | null> {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  let valid: boolean;
  try {
    const key = await importKey(secret);
    // crypto.subtle.verify compares in constant time, so this doesn't leak
    // information about the expected signature via timing.
    valid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64urlDecode(signature),
      encoder.encode(encoded)
    );
  } catch {
    return null;
  }
  if (!valid) return null;

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(base64urlDecode(encoded))
    ) as SessionPayload;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now() / 1000) {
      return null;
    }
    return { id: payload.id, login: payload.login, avatarUrl: payload.avatarUrl };
  } catch {
    return null;
  }
}

// --- Cookies ---

/**
 * `httpOnly` keeps the cookie out of reach of any XSS on the page, and
 * `sameSite: 'lax'` means a cross-site form post can't ride along on it —
 * which is what protects the mutating API routes from CSRF.
 */
function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export function setSessionCookie(cookies: AstroCookies, token: string): void {
  cookies.set(SESSION_COOKIE, token, cookieOptions(SESSION_MAX_AGE_SECONDS));
}

export function clearSessionCookie(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function setOAuthStateCookie(cookies: AstroCookies, state: string): void {
  cookies.set(OAUTH_STATE_COOKIE, state, cookieOptions(OAUTH_STATE_MAX_AGE_SECONDS));
}

export function clearOAuthStateCookie(cookies: AstroCookies): void {
  cookies.delete(OAUTH_STATE_COOKIE, { path: '/' });
}

/** Resolve the signed-in user from cookies, or null if there isn't a valid one. */
export async function getSessionUser(cookies: AstroCookies): Promise<SessionUser | null> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const secret = readEnv('SESSION_SECRET');
  if (!secret) return null;

  return verifySession(token, secret);
}
