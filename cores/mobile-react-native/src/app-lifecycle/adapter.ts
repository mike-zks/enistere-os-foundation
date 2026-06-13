/**
 * App-lifecycle adapter contract (RN 15 — app lifecycle).
 *
 * The seam between the agnostic {@link AppLifecycleService} and the platform
 * source (RN `AppState` : `currentState` + `addEventListener('change', …)`). The
 * foundation ships only the contract + an in-memory placeholder — NO real
 * `AppState`, NO native module (mission). A derived project wires a real adapter
 * (which SHOULD normalise via `normalizeAppLifecycleState`).
 *
 * Agnostic (no React/RN import) → `node --test`-able.
 */
import type { AppLifecycleState } from './state';

export interface AppLifecycleAdapter {
  /** Current app state (synchronous). */
  getState(): AppLifecycleState;
  /** Observe state changes; returns an unsubscribe function. */
  subscribe(listener: (state: AppLifecycleState) => void): () => void;
}

/**
 * Controlled error for a failed adapter operation. Carries only the safe
 * `operation` (no underlying message/cause → no sensitive leak).
 */
export class AppLifecycleAdapterError extends Error {
  readonly operation: 'getState' | 'subscribe';

  constructor(operation: 'getState' | 'subscribe') {
    super(`App lifecycle adapter "${operation}" failed.`);
    this.name = 'AppLifecycleAdapterError';
    this.operation = operation;
  }
}
