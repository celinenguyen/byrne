/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** The signed-in GitHub user, or null when signed out. Set by middleware. */
    user: import('./lib/auth').SessionUser | null;
    /** Whether that user is allowed to edit decks. Branch on this, not on `user`. */
    canEdit: boolean;
  }
}
