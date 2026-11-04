import type { DeckStorage } from './types';

export { DeckConflictError } from './types';
export type { DeckStorage, StoredDeck, WriteOptions } from './types';

/**
 * Pick where decks live: `data/` on disk during `npm run dev`, R2 in the
 * deployed Worker.
 *
 * Both are dynamic imports so that each environment only loads its own
 * backend — the R2 module imports `cloudflare:workers`, which doesn't exist
 * under Node, and `astro build` replaces `import.meta.env.DEV` with a constant.
 */
export async function getDeckStorage(): Promise<DeckStorage> {
  if (import.meta.env.DEV) {
    return (await import('./fs')).fsStorage;
  }
  return (await import('./r2')).r2Storage;
}
