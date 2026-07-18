/**
 * Framework-agnostic app-lifecycle service (RN 15 — app lifecycle).
 *
 * Tracks a normalised {@link AppLifecycleState} on top of an
 * {@link AppLifecycleAdapter}: it reads the initial state, **validates** every
 * transition (adapter-driven or manual via {@link AppLifecycleService.transition})
 * and fans the result out to its own subscribers. It is **best-effort and
 * non-intrusive**: a failing adapter never breaks the app flow (caught + safe
 * `warn`, state defaults to `unknown`); a throwing listener is isolated.
 *
 * Logging (ADR-040 / RN 8) : optional injected logger; the lifecycle carries NO
 * user data, so it logs ONLY enum fields (`{ from, to }` / `{ operation }`).
 *
 * PURE / framework-agnostic (no React/RN import; no `Date.now()`) → `node --test`.
 */
import type { Logger } from '../logger/logger';
import { AppLifecycleAdapterError, type AppLifecycleAdapter } from './adapter';
import { nextAppLifecycleState, normalizeAppLifecycleState, type AppLifecycleState } from './state';

export interface AppLifecycleService {
  /** Current (validated) app-lifecycle state. */
  getState(): AppLifecycleState;
  /** Observe validated state changes; returns an unsubscribe function. */
  subscribe(listener: (state: AppLifecycleState) => void): () => void;
  /** Push a candidate state through validation; returns the resulting state. */
  transition(candidate: unknown): AppLifecycleState;
  /** Tear down the adapter subscription and drop all listeners. */
  dispose(): void;
}

export interface AppLifecycleServiceOptions {
  readonly adapter: AppLifecycleAdapter;
  /** Optional RN 8 logger (enum fields only). */
  readonly logger?: Logger;
}

/** Build an {@link AppLifecycleService} over an adapter (+ optional safe logger). */
export function createAppLifecycleService(
  options: AppLifecycleServiceOptions,
): AppLifecycleService {
  const { adapter, logger } = options;

  let current: AppLifecycleState;
  try {
    current = normalizeAppLifecycleState(adapter.getState());
  } catch {
    logger?.warn('app lifecycle getState failed', {
      operation: new AppLifecycleAdapterError('getState').operation,
    });
    current = 'unknown';
  }

  const listeners = new Set<(state: AppLifecycleState) => void>();

  function apply(candidate: unknown): AppLifecycleState {
    const next = nextAppLifecycleState(current, candidate);
    if (next === current) {
      return current;
    }
    const from = current;
    current = next;
    logger?.debug('app lifecycle transition', { from, to: next });
    for (const listener of listeners) {
      try {
        listener(next);
      } catch {
        // Isolate a faulty listener — it must not break the others / the flow.
        logger?.warn('app lifecycle listener failed');
      }
    }
    return current;
  }

  let adapterUnsubscribe: (() => void) | null = null;
  try {
    adapterUnsubscribe = adapter.subscribe((raw) => {
      apply(raw);
    });
  } catch {
    logger?.warn('app lifecycle subscribe failed', {
      operation: new AppLifecycleAdapterError('subscribe').operation,
    });
  }

  return {
    getState: () => current,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    transition: (candidate) => apply(candidate),
    dispose: () => {
      if (adapterUnsubscribe) {
        try {
          adapterUnsubscribe();
        } catch {
          /* ignore teardown errors */
        }
        adapterUnsubscribe = null;
      }
      listeners.clear();
    },
  };
}
