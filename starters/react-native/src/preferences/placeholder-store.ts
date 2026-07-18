/**
 * In-memory placeholder preference store (RN 20 — preferences).
 *
 * A dependency-free {@link PreferenceStore} for tests / wiring. It is a *dumb*
 * key-value sink (the service guards keys/values) and returns DEFENSIVE COPIES —
 * NO real MMKV, NO real AsyncStorage, NO persistence (mission). A derived project
 * replaces it with a real adapter; the contract and the service stay identical.
 *
 * It stores values as-is (only coerced to a {@link PreferenceValue} + bounded),
 * so a test can seed an externally-written value (even a "sensitive-looking"
 * string) and prove the SERVICE sanitises it on read.
 *
 * Agnostic (no React/RN import) → `node --test`-able.
 */
import type { PreferenceStore } from './adapter';
import { normalizePreferenceValue, type PreferenceSet, type PreferenceValue } from './model';

/** A placeholder store with an inspector for wiring/tests. */
export interface PlaceholderPreferenceStore extends PreferenceStore {
  /** Defensive copy of the current raw contents. */
  snapshot(): PreferenceSet;
}

/** Create an in-memory placeholder preference store (no native dependency). */
export function createPlaceholderPreferenceStore(): PlaceholderPreferenceStore {
  const data = new Map<string, PreferenceValue>();
  const listeners = new Set<(set: PreferenceSet) => void>();

  function currentSet(): PreferenceSet {
    return Object.freeze(Object.fromEntries(data));
  }

  function notify(): void {
    const snapshot = currentSet();
    for (const listener of listeners) {
      listener(snapshot);
    }
  }

  return {
    get: (key) => Promise.resolve(data.get(key)),
    set: (key, value) => {
      const normalized = normalizePreferenceValue(value);
      if (normalized !== undefined) {
        data.set(key, normalized);
        notify();
      }
      return Promise.resolve();
    },
    remove: (key) => {
      if (data.delete(key)) {
        notify();
      }
      return Promise.resolve();
    },
    clear: () => {
      if (data.size > 0) {
        data.clear();
        notify();
      }
      return Promise.resolve();
    },
    getAll: () => Promise.resolve(currentSet()),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    snapshot: () => currentSet(),
  };
}
