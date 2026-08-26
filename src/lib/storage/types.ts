import type { Deck, DeckSummary } from '../types';

/** A deck plus the backend's version marker, when it has one. */
export interface StoredDeck {
  deck: Deck;
  /**
   * Opaque version identifier. GitHub returns a blob sha; the filesystem
   * backend has no equivalent and leaves this undefined.
   */
  sha?: string;
}

export interface WriteOptions {
  /**
   * The version the caller believes it is updating. When provided and the
   * backend supports it, a mismatch raises DeckConflictError instead of
   * silently overwriting someone else's change.
   */
  sha?: string;
  /** Commit message, for backends that make commits. */
  message?: string;
}

/**
 * Raised when a write targets a version that is no longer current — i.e. the
 * deck changed underneath you, typically because you also edited it locally
 * and pushed. Surfaced to the client as a 409.
 */
export class DeckConflictError extends Error {
  constructor(message = 'This deck changed since you loaded it.') {
    super(message);
    this.name = 'DeckConflictError';
  }
}

/**
 * Where decks live.
 *
 * Both implementations operate on the same flat `data/<filename>.json` layout,
 * so a deck written by one backend is readable by the other. That's what makes
 * `git pull` after editing on the deployed site do the obvious thing.
 */
export interface DeckStorage {
  /** Deck filenames without the `.json` extension. */
  listFilenames(): Promise<string[]>;
  /** Summaries for the deck picker. */
  list(): Promise<DeckSummary[]>;
  read(filename: string): Promise<StoredDeck | null>;
  write(filename: string, deck: Deck, options?: WriteOptions): Promise<{ sha?: string }>;
  remove(filename: string, options?: { message?: string }): Promise<void>;
}

/** Build a DeckSummary from a deck's contents. */
export function summarize(deck: Deck, filename: string): DeckSummary {
  return {
    // Decks predating id-based URLs fall back to their filename, which is
    // stable enough to keep links working. We deliberately don't backfill a
    // generated id here — on the GitHub backend that would mean committing on
    // every read.
    id: deck.meta?.id ?? filename,
    title: deck.meta?.title ?? filename,
    filename,
    updatedAt: deck.meta?.updatedAt ?? '',
    slideCount: deck.slides?.length ?? 0,
    status: deck.meta?.status,
    publishedAt: deck.meta?.publishedAt,
  };
}
