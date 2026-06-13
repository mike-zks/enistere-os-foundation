/**
 * In-memory placeholder consent store (RN 21 — consent).
 *
 * A dependency-free {@link ConsentStore} for tests / wiring. It holds the
 * consent set in memory, returns DEFENSIVE COPIES, and notifies subscribers on
 * change — NO persistence, NO network (mission). A derived project uses
 * {@link createPreferenceConsentStore} (RN 20-backed) or a real adapter; the
 * contract and the service stay identical.
 *
 * Agnostic (no React/RN import) → `node --test`-able.
 */
import type { ConsentStore } from './store';
import {
  normalizeConsentStatus,
  sanitizeConsentSet,
  type ConsentCategory,
  type ConsentSet,
  type ConsentStatus,
} from './model';

/** Create an in-memory placeholder consent store (no persistence). */
export function createPlaceholderConsentStore(initial?: ConsentSet): ConsentStore {
  const data = new Map<ConsentCategory, ConsentStatus>();
  for (const [category, status] of Object.entries(sanitizeConsentSet(initial))) {
    data.set(category as ConsentCategory, status as ConsentStatus);
  }
  const listeners = new Set<(set: ConsentSet) => void>();

  function currentSet(): ConsentSet {
    return Object.freeze(Object.fromEntries(data)) as ConsentSet;
  }

  function notify(): void {
    const snapshot = currentSet();
    for (const listener of listeners) {
      listener(snapshot);
    }
  }

  return {
    get: (category) => Promise.resolve(data.get(category) ?? 'unknown'),
    set: (category, status) => {
      const normalized = normalizeConsentStatus(status);
      if (normalized === 'unknown') {
        if (data.delete(category)) {
          notify();
        }
      } else if (data.get(category) !== normalized) {
        data.set(category, normalized);
        notify();
      }
      return Promise.resolve();
    },
    getAll: () => Promise.resolve(currentSet()),
    clear: () => {
      if (data.size > 0) {
        data.clear();
        notify();
      }
      return Promise.resolve();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
