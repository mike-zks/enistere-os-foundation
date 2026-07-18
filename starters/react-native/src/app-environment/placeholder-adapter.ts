/**
 * In-memory placeholder app-environment adapter (RN 22 — app environment).
 *
 * A dependency-free {@link AppEnvironmentAdapter} for tests / wiring. It holds a
 * sanitised snapshot in memory and returns DEFENSIVE COPIES — NO real
 * `expo-device`/`expo-application`, NO native module, NO persistence (mission). A
 * derived project replaces it with a real adapter; the contract and the service
 * stay identical.
 *
 * `getSnapshot` / `setSnapshot` run the value through
 * {@link sanitizeAppEnvironmentSnapshot}, so even a "seed" with an identifier is
 * stripped to the allow-listed, non-identifying fields.
 *
 * Agnostic (no React/RN import) → `node --test`-able.
 */
import type { AppEnvironmentAdapter } from './adapter';
import { sanitizeAppEnvironmentSnapshot, type AppEnvironmentSnapshot } from './model';

/** A placeholder adapter with a `setSnapshot` for wiring/tests. */
export interface PlaceholderAppEnvironmentAdapter extends AppEnvironmentAdapter {
  setSnapshot(snapshot: unknown): void;
}

/** Create an in-memory placeholder app-environment adapter (no native dependency). */
export function createPlaceholderAppEnvironmentAdapter(
  initial?: unknown,
): PlaceholderAppEnvironmentAdapter {
  let current: AppEnvironmentSnapshot = sanitizeAppEnvironmentSnapshot(initial);

  return {
    // Already frozen by the sanitiser; return as-is (callers cannot mutate it).
    getSnapshot: () => current,
    setSnapshot: (snapshot) => {
      current = sanitizeAppEnvironmentSnapshot(snapshot);
    },
  };
}
