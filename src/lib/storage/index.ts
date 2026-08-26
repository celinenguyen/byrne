import { readEnv } from '../auth';
import { fsStorage } from './fs';
import { githubStorage } from './github';
import type { DeckStorage } from './types';

export { DeckConflictError } from './types';
export type { DeckStorage, StoredDeck, WriteOptions } from './types';

/**
 * Pick where decks live.
 *
 * Local development writes to `data/` on disk; production commits to GitHub.
 * `DECK_STORAGE` overrides the default either way, which is how the GitHub
 * backend gets exercised against a scratch branch without deploying.
 *
 * The default is deliberately not "use GitHub if the token happens to be set" —
 * that would let a missing env var in production silently downgrade to the
 * filesystem, where writes appear to succeed and then vanish with the next
 * deploy. Better to fail loudly on the missing variable.
 */
export function getDeckStorage(): DeckStorage {
  const override = readEnv('DECK_STORAGE');
  if (override === 'fs') return fsStorage;
  if (override === 'github') return githubStorage;
  return import.meta.env.DEV ? fsStorage : githubStorage;
}
