/**
 * Framework-agnostic feature-flag service (RN 17 — feature flags / config).
 *
 * Resolves a {@link FlagSet} from base `defaults` overlaid by a
 * {@link FlagAdapter} source, exposes type-safe reads with **safe defaults**
 * (`getFlag`), the full set (`getAll`), change subscription, a best-effort
 * `refresh`, and `dispose`. It is **non-intrusive**: a failing adapter never
 * breaks the app flow (caught + safe `warn`, current set kept); a throwing
 * listener is isolated.
 *
 * Logging (ADR-040 / RN 8) : optional injected logger; logs ONLY a `{ count }`
 * (or `{ operation }` on error) — NEVER flag keys or values.
 *
 * PURE / framework-agnostic (no React/RN import) → `node --test`-able.
 */
import type { Logger } from '../logger/logger';
import { FlagAdapterError, type FlagAdapter } from './flag-adapter';
import {
  describeFlagsForLog,
  getFlagValue,
  sanitizeFlagSet,
  type FlagSet,
  type FlagValue,
} from './flag-model';

export interface FlagService {
  /** Read a flag, falling back to `defaultValue` when absent or mistyped. */
  getFlag(key: string, defaultValue: boolean): boolean;
  getFlag(key: string, defaultValue: string): string;
  getFlag(key: string, defaultValue: number): number;
  getFlag(key: string, defaultValue: FlagValue): FlagValue;
  /** The full resolved flag set (a copy). */
  getAll(): FlagSet;
  /** Observe resolved-set changes; returns an unsubscribe function. */
  subscribe(listener: (flags: FlagSet) => void): () => void;
  /** Best-effort refresh from the adapter (never throws). */
  refresh(): Promise<void>;
  /** Tear down the adapter subscription and drop all listeners. */
  dispose(): void;
}

export interface FlagServiceOptions {
  readonly adapter: FlagAdapter;
  /** Base defaults overlaid by the adapter source (sanitised). */
  readonly defaults?: Readonly<Record<string, unknown>>;
  /** Optional RN 8 logger (`{ count }` / `{ operation }` only). */
  readonly logger?: Logger;
}

/** Build a {@link FlagService} over a flag adapter (+ defaults / optional logger). */
export function createFlagService(options: FlagServiceOptions): FlagService {
  const { adapter, logger } = options;
  const defaults = sanitizeFlagSet(options.defaults ?? {});

  function resolve(sourceFlags: FlagSet): FlagSet {
    // Adapter flags overlay the base defaults.
    return { ...defaults, ...sourceFlags };
  }

  let current: FlagSet;
  try {
    current = resolve(sanitizeFlagSet(adapter.getFlags()));
  } catch {
    logger?.warn('flags getFlags failed', { operation: new FlagAdapterError('getFlags').operation });
    current = { ...defaults };
  }

  const listeners = new Set<(flags: FlagSet) => void>();

  function update(sourceFlags: FlagSet): void {
    current = resolve(sanitizeFlagSet(sourceFlags));
    logger?.debug('flags updated', { ...describeFlagsForLog(current) });
    for (const listener of listeners) {
      try {
        listener({ ...current });
      } catch {
        logger?.warn('flags listener failed');
      }
    }
  }

  let adapterUnsubscribe: (() => void) | null = null;
  if (adapter.subscribe) {
    try {
      adapterUnsubscribe = adapter.subscribe((flags) => {
        update(flags);
      });
    } catch {
      logger?.warn('flags subscribe failed', {
        operation: new FlagAdapterError('subscribe').operation,
      });
    }
  }

  function getFlag(key: string, defaultValue: FlagValue): FlagValue {
    return getFlagValue(current, key, defaultValue);
  }

  async function refresh(): Promise<void> {
    if (!adapter.refresh) {
      return;
    }
    try {
      const fresh = await adapter.refresh();
      update(fresh);
    } catch {
      // Best-effort: a refresh failure keeps the current set, never throws.
      logger?.warn('flags refresh failed', { operation: new FlagAdapterError('refresh').operation });
    }
  }

  return {
    getFlag: getFlag as FlagService['getFlag'],
    getAll: () => ({ ...current }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    refresh,
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
