/**
 * Framework-agnostic non-sensitive preference service (RN 20 — preferences).
 *
 * A **best-effort, non-intrusive** wrapper over a {@link PreferenceStore}: it
 * GUARDS every write (rejects sensitive keys and sensitive string values — never
 * persisting a masked secret) and SANITISES every read (so a stray secret in the
 * store never surfaces). It is **async** (the store is async) and NEVER throws —
 * a failing store yields a safe default / no-op + a safe `warn`.
 *
 * Deliberately NOT provided (mission / ADR-015 §15/§16): no real MMKV, no real
 * AsyncStorage, no SecureStore (secrets), no Zustand persistence, no network, no
 * remote-config, no business logic. Preferences are persisted NON-SENSITIVE data
 * only — distinct from SecureStore (secrets), the RN 6 Zustand store (in-memory
 * UI state) and TanStack Query (server-state).
 *
 * Logging (ADR-040 / RN 8) : optional injected logger; logs ONLY
 * `{ operation, count? }` — NEVER a key or a value.
 *
 * PURE / framework-agnostic (no React/RN import; no `Date.now()`) → `node --test`.
 */
import type { Logger } from '../logger/logger';
import { PreferenceStoreError, type PreferenceStore } from './adapter';
import {
  describePreferencesForLog,
  getPreferenceValue,
  isSensitivePreferenceValue,
  isValidPreferenceKey,
  normalizePreferenceValue,
  sanitizePreferenceSet,
  type PreferenceSet,
  type PreferenceValue,
} from './model';

export interface PreferenceService {
  /** Read a preference (sanitised); `undefined` if absent/invalid/sensitive. */
  get(key: string): Promise<PreferenceValue | undefined>;
  /** Read a boolean preference (safe default on absence/type mismatch). */
  getBoolean(key: string, defaultValue: boolean): Promise<boolean>;
  /** Read a string preference (safe default on absence/type mismatch). */
  getString(key: string, defaultValue: string): Promise<string>;
  /** Read a number preference (safe default on absence/type mismatch). */
  getNumber(key: string, defaultValue: number): Promise<number>;
  /** Persist a preference. No-op when the key/value is invalid or sensitive. */
  set(key: string, value: PreferenceValue): Promise<void>;
  /** Remove a preference (no-op on a failing store). */
  remove(key: string): Promise<void>;
  /** Remove all preferences (no-op on a failing store). */
  clear(): Promise<void>;
  /** The full sanitised set (a copy). */
  getAll(): Promise<PreferenceSet>;
  /** Observe sanitised changes; returns an unsubscribe function. */
  subscribe(listener: (set: PreferenceSet) => void): () => void;
}

export interface PreferenceServiceOptions {
  readonly store: PreferenceStore;
  /** Optional RN 8 logger (`{ operation, count? }` only). */
  readonly logger?: Logger;
}

/** Build a {@link PreferenceService} over a store (+ optional safe logger). */
export function createPreferenceService(options: PreferenceServiceOptions): PreferenceService {
  const { store, logger } = options;

  async function get(key: string): Promise<PreferenceValue | undefined> {
    if (!isValidPreferenceKey(key)) {
      return undefined;
    }
    try {
      const normalized = normalizePreferenceValue(await store.get(key));
      if (normalized === undefined || isSensitivePreferenceValue(normalized)) {
        return undefined;
      }
      return normalized;
    } catch {
      logger?.warn('preferences get failed', { operation: new PreferenceStoreError('get').operation });
      return undefined;
    }
  }

  async function typed<T extends PreferenceValue>(key: string, defaultValue: T): Promise<T> {
    const value = await get(key);
    if (value === undefined) {
      return defaultValue;
    }
    return getPreferenceValue({ [key]: value } as PreferenceSet, key, defaultValue);
  }

  const listeners = new Set<(set: PreferenceSet) => void>();
  if (store.subscribe) {
    try {
      store.subscribe((raw) => {
        const sanitised = sanitizePreferenceSet(raw);
        logger?.debug('preferences changed', { operation: 'subscribe', ...describePreferencesForLog(sanitised) });
        for (const listener of listeners) {
          try {
            listener(sanitised);
          } catch {
            logger?.warn('preferences listener failed', { operation: 'subscribe' });
          }
        }
      });
    } catch {
      logger?.warn('preferences subscribe failed', {
        operation: new PreferenceStoreError('subscribe').operation,
      });
    }
  }

  return {
    get,
    getBoolean: (key, defaultValue) => typed(key, defaultValue),
    getString: (key, defaultValue) => typed(key, defaultValue),
    getNumber: (key, defaultValue) => typed(key, defaultValue),
    set: async (key, value) => {
      const normalized = normalizePreferenceValue(value);
      // Drop invalid/sensitive keys or values — never persist a (masked) secret.
      if (!isValidPreferenceKey(key) || normalized === undefined || isSensitivePreferenceValue(normalized)) {
        logger?.warn('preferences set rejected', { operation: 'set' });
        return;
      }
      try {
        await store.set(key, normalized);
      } catch {
        logger?.warn('preferences set failed', { operation: new PreferenceStoreError('set').operation });
      }
    },
    remove: async (key) => {
      try {
        await store.remove(key);
      } catch {
        logger?.warn('preferences remove failed', {
          operation: new PreferenceStoreError('remove').operation,
        });
      }
    },
    clear: async () => {
      try {
        await store.clear();
      } catch {
        logger?.warn('preferences clear failed', {
          operation: new PreferenceStoreError('clear').operation,
        });
      }
    },
    getAll: async () => {
      if (!store.getAll) {
        return Object.freeze({});
      }
      try {
        const sanitised = sanitizePreferenceSet(await store.getAll());
        logger?.debug('preferences read', { operation: 'getAll', ...describePreferencesForLog(sanitised) });
        return sanitised;
      } catch {
        logger?.warn('preferences getAll failed', {
          operation: new PreferenceStoreError('getAll').operation,
        });
        return Object.freeze({});
      }
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
