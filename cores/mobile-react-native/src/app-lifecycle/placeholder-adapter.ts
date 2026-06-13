/**
 * In-memory placeholder app-lifecycle adapter (RN 15 — app lifecycle).
 *
 * A dependency-free {@link AppLifecycleAdapter} for tests / wiring. It holds the
 * state in memory and lets a test simulate OS changes via `setState` — NO real
 * RN `AppState`, NO native module, NO persistence (mission). A derived project
 * replaces it with a real adapter; the contract and the service stay identical.
 *
 * `setState` normalises and notifies subscribers only when the state actually
 * changes (the OS is authoritative — transition validation lives in the service).
 *
 * Agnostic (no React/RN import) → `node --test`-able.
 */
import type { AppLifecycleAdapter } from './adapter';
import { normalizeAppLifecycleState, type AppLifecycleState } from './state';

/** A placeholder adapter with an extra `setState` for wiring/tests. */
export interface PlaceholderAppLifecycleAdapter extends AppLifecycleAdapter {
  setState(state: AppLifecycleState): void;
}

/** Create an in-memory placeholder app-lifecycle adapter (no native dependency). */
export function createPlaceholderAppLifecycleAdapter(
  initial: AppLifecycleState = 'unknown',
): PlaceholderAppLifecycleAdapter {
  let current = normalizeAppLifecycleState(initial);
  const listeners = new Set<(state: AppLifecycleState) => void>();

  return {
    getState: () => current,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setState: (state) => {
      const next = normalizeAppLifecycleState(state);
      if (next !== current) {
        current = next;
        for (const listener of listeners) {
          listener(current);
        }
      }
    },
  };
}
