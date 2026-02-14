/**
 * Returns a keydown handler that calls `callback` when Enter or Space is pressed.
 * Use on elements with role="button" so they behave like native buttons for
 * keyboard users — without this, only mouse clicks would activate them.
 */
export function keyboardClick(callback: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  };
}

export interface KeyBinding {
  key: string;
  meta?: boolean;
  shift?: boolean;
  mode: 'edit' | 'present';
  /** Return true to preventDefault. Returning false/undefined skips preventDefault. */
  action: () => boolean | void;
}

/**
 * Match a keyboard event against a list of bindings and execute the first match.
 * Returns true if a binding matched (so the caller can stop processing).
 */
export function matchBinding(e: KeyboardEvent, mode: string, bindings: KeyBinding[]): boolean {
  for (const b of bindings) {
    if (b.mode !== mode) continue;
    if (b.key !== e.key) continue;
    if (b.meta && !(e.metaKey || e.ctrlKey)) continue;
    if (!b.meta && (e.metaKey || e.ctrlKey)) continue;
    if (b.shift && !e.shiftKey) continue;
    if (!b.shift && e.shiftKey) continue;
    const result = b.action();
    if (result !== false) e.preventDefault();
    return true;
  }
  return false;
}
