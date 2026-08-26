import { readEnv, requireEnv } from '../auth';
import type { Deck, DeckSummary } from '../types';
import {
  DeckConflictError,
  summarize,
  type DeckStorage,
  type StoredDeck,
  type WriteOptions,
} from './types';

/**
 * Decks stored as JSON files in the repo, written through the GitHub Contents
 * API — what the deployed site uses.
 *
 * The point of this backend is that the deployed editor and your local
 * checkout are looking at the same files. Editing a deck at byrne.vercel.app
 * produces a real commit on `main`; `git pull` brings it down. There is no
 * separate database to reconcile.
 *
 * The commit also triggers a Vercel redeploy, which is how published changes
 * reach the static public read path.
 */

const API_ROOT = 'https://api.github.com';
const DATA_DIR = 'data';

interface ContentsFile {
  name: string;
  path: string;
  sha: string;
  type: string;
  content?: string;
  encoding?: string;
}

function config() {
  return {
    // e.g. "celinenguyen/byrne"
    repo: requireEnv('GITHUB_REPO'),
    token: requireEnv('GITHUB_REPO_TOKEN'),
    branch: readEnv('GITHUB_BRANCH') ?? 'main',
  };
}

function pathFor(filename: string): string {
  return `${DATA_DIR}/${filename}.json`;
}

/**
 * btoa/atob operate on latin1, so text has to go through TextEncoder first or
 * anything non-ASCII (curly quotes in deck titles, em dashes, accents) is
 * mangled on the way to GitHub.
 */
function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): string {
  // GitHub wraps base64 payloads at 60 characters.
  const binary = atob(value.replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function githubFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { token } = config();
  return fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'byrne-slide-decks',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
    // Deck contents must be authoritative — a cached response could hand back
    // a version we just overwrote.
    cache: 'no-store',
  });
}

async function describeFailure(res: Response, action: string): Promise<Error> {
  let detail = '';
  try {
    const body = (await res.json()) as { message?: string };
    detail = body.message ? `: ${body.message}` : '';
  } catch {
    // Non-JSON error body; the status alone will have to do.
  }
  if (res.status === 401 || res.status === 403) {
    return new Error(
      `GitHub rejected the request while ${action} (${res.status}${detail}). ` +
        `Check that GITHUB_REPO_TOKEN is valid and has Contents: read and write on GITHUB_REPO.`
    );
  }
  return new Error(`GitHub request failed while ${action} (${res.status}${detail}).`);
}

async function readFileAt(path: string): Promise<{ text: string; sha: string } | null> {
  const { repo, branch } = config();
  const res = await githubFetch(
    `/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`
  );

  if (res.status === 404) return null;
  if (!res.ok) throw await describeFailure(res, `reading ${path}`);

  const file = (await res.json()) as ContentsFile;
  if (!file.content) {
    // The Contents API omits content for blobs over 1MB. Deck JSON is orders
    // of magnitude smaller, so this means something unexpected is at the path.
    throw new Error(`${path} returned no content — is it larger than 1MB?`);
  }
  return { text: fromBase64(file.content), sha: file.sha };
}

export const githubStorage: DeckStorage = {
  async listFilenames(): Promise<string[]> {
    const { repo, branch } = config();
    const res = await githubFetch(
      `/repos/${repo}/contents/${DATA_DIR}?ref=${encodeURIComponent(branch)}`
    );

    if (res.status === 404) return [];
    if (!res.ok) throw await describeFailure(res, `listing ${DATA_DIR}/`);

    const entries = (await res.json()) as ContentsFile[];
    return entries
      .filter((entry) => entry.type === 'file' && entry.name.endsWith('.json'))
      .map((entry) => entry.name.replace(/\.json$/, ''));
  },

  async list(): Promise<DeckSummary[]> {
    const filenames = await this.listFilenames();
    // One request per deck. Fine at this scale; if the deck count ever grows
    // into the dozens, switch to the Git Trees API and fetch blobs in bulk.
    const summaries = await Promise.all(
      filenames.map(async (filename) => {
        const file = await readFileAt(pathFor(filename));
        if (!file) return null;
        return summarize(JSON.parse(file.text) as Deck, filename);
      })
    );
    return summaries.filter((summary): summary is DeckSummary => summary !== null);
  },

  async read(filename: string): Promise<StoredDeck | null> {
    const file = await readFileAt(pathFor(filename));
    if (!file) return null;
    return { deck: JSON.parse(file.text) as Deck, sha: file.sha };
  },

  async write(filename: string, deck: Deck, options: WriteOptions = {}): Promise<{ sha?: string }> {
    const { repo, branch } = config();
    const path = pathFor(filename);

    // Updating an existing file requires its current sha. When the caller
    // supplies one we use it as an optimistic lock; otherwise we look it up,
    // which makes the write last-one-wins.
    let sha = options.sha;
    if (!sha) {
      const existing = await readFileAt(path);
      sha = existing?.sha;
    }

    const res = await githubFetch(`/repos/${repo}/contents/${encodeURIComponent(path)}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: options.message ?? `Update deck: ${deck.meta?.title ?? filename}`,
        content: toBase64(JSON.stringify(deck, null, 2)),
        branch,
        ...(sha ? { sha } : {}),
      }),
    });

    // 409 is a genuine race; 422 covers a sha that no longer refers to this
    // file. Both mean the same thing to a caller: reload before saving.
    if (res.status === 409 || res.status === 422) {
      throw new DeckConflictError();
    }
    if (!res.ok) throw await describeFailure(res, `writing ${path}`);

    const body = (await res.json()) as { content?: { sha?: string } };
    return { sha: body.content?.sha };
  },

  async remove(filename: string, options: { message?: string } = {}): Promise<void> {
    const { repo, branch } = config();
    const path = pathFor(filename);

    const existing = await readFileAt(path);
    if (!existing) {
      const error = new Error(`Deck not found: ${filename}`);
      error.name = 'DeckNotFoundError';
      throw error;
    }

    const res = await githubFetch(`/repos/${repo}/contents/${encodeURIComponent(path)}`, {
      method: 'DELETE',
      body: JSON.stringify({
        message: options.message ?? `Delete deck: ${filename}`,
        sha: existing.sha,
        branch,
      }),
    });

    if (!res.ok) throw await describeFailure(res, `deleting ${path}`);
  },
};
