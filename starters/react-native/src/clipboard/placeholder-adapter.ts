/**
 * In-memory placeholder clipboard adapter (RN 23 — clipboard).
 *
 * A dependency-free {@link ClipboardAdapter} for tests / wiring. It holds the
 * "clipboard" string in memory (a single transient slot) — NO real
 * `expo-clipboard`, NO native module, NO durable persistence (mission). A
 * derived project replaces it with a real adapter; the contract and the service
 * stay identical.
 *
 * It is a transient slot only: the value lives for the process lifetime and is
 * never written anywhere. Agnostic (no React/RN import) → `node --test`-able.
 */
import type { ClipboardAdapter } from './adapter';

/** A placeholder adapter with a `peek` for assertions (returns the raw slot). */
export interface PlaceholderClipboardAdapter extends ClipboardAdapter {
  getString(): Promise<string>;
  hasString(): Promise<boolean>;
  clear(): Promise<void>;
  /** Test-only: the current in-memory slot (`undefined` when empty). */
  peek(): string | undefined;
}

/** Create an in-memory placeholder clipboard adapter (no native dependency). */
export function createPlaceholderClipboardAdapter(): PlaceholderClipboardAdapter {
  let slot: string | undefined;

  return {
    setString: (text) => {
      slot = text;
      return Promise.resolve();
    },
    getString: () => Promise.resolve(slot ?? ''),
    hasString: () => Promise.resolve(typeof slot === 'string' && slot.length > 0),
    clear: () => {
      slot = undefined;
      return Promise.resolve();
    },
    peek: () => slot,
  };
}
