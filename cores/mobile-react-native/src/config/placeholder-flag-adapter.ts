/**
 * In-memory placeholder feature-flag adapter (RN 17 — feature flags / config).
 *
 * A dependency-free {@link FlagAdapter} for tests / wiring. It holds a sanitised
 * flag set in memory and lets a test simulate source changes via `setFlags` — NO
 * real remote-config SDK, NO network, NO persistence (mission). A derived project
 * replaces it with a real adapter; the contract and the service stay identical.
 *
 * Agnostic (no React/RN import) → `node --test`-able.
 */
import type { FlagAdapter } from './flag-adapter';
import { sanitizeFlagSet, type FlagSet } from './flag-model';

/** A placeholder adapter with an extra `setFlags` for wiring/tests. */
export interface PlaceholderFlagAdapter extends FlagAdapter {
  /** Simulate a source change (sanitised + notifies subscribers). */
  setFlags(input: unknown): void;
}

/** Create an in-memory placeholder flag adapter (no native dependency). */
export function createPlaceholderFlagAdapter(initial: unknown = {}): PlaceholderFlagAdapter {
  let current: FlagSet = sanitizeFlagSet(initial);
  const listeners = new Set<(flags: FlagSet) => void>();

  return {
    getFlags: () => ({ ...current }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async refresh(): Promise<FlagSet> {
      return { ...current };
    },
    setFlags: (input) => {
      current = sanitizeFlagSet(input);
      for (const listener of listeners) {
        listener({ ...current });
      }
    },
  };
}
