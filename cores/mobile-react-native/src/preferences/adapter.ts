/**
 * Preference-store adapter contract (RN 20 — preferences).
 *
 * The seam between the agnostic {@link PreferenceService} and a future real
 * key-value store for NON-SENSITIVE data (MMKV / AsyncStorage). The foundation
 * ships only the contract + an in-memory placeholder — NO real MMKV, NO real
 * AsyncStorage, NO SecureStore (secrets stay in SecureStore), NO persistence
 * (mission). A derived project wires a real adapter under ADR-015 §15/§16.
 *
 * The store is a *dumb* key-value sink: the SERVICE is the guard (it rejects
 * sensitive keys/values before writing and sanitises whatever it reads back).
 * Operations are async (AsyncStorage is async; MMKV can resolve immediately).
 *
 * Agnostic (no React/RN import) → `node --test`-able.
 */
import type { PreferenceSet, PreferenceValue } from './model';

export interface PreferenceStore {
  /** Read a single preference (resolves `undefined` when absent). */
  get(key: string): Promise<PreferenceValue | undefined>;
  /** Write a single preference. */
  set(key: string, value: PreferenceValue): Promise<void>;
  /** Remove a single preference. */
  remove(key: string): Promise<void>;
  /** Remove all preferences owned by this store. */
  clear(): Promise<void>;
  /** Read the full set (optional — a store may not support enumeration). */
  getAll?(): Promise<PreferenceSet>;
  /** Observe changes (optional); returns an unsubscribe function. */
  subscribe?(listener: (set: PreferenceSet) => void): () => void;
}

/**
 * Controlled error for a failed store operation. Carries only the safe
 * `operation` — NO key, value or underlying cause (no sensitive leak).
 */
export class PreferenceStoreError extends Error {
  readonly operation: 'get' | 'set' | 'remove' | 'clear' | 'getAll' | 'subscribe';

  constructor(operation: 'get' | 'set' | 'remove' | 'clear' | 'getAll' | 'subscribe') {
    super(`Preference store "${operation}" failed.`);
    this.name = 'PreferenceStoreError';
    this.operation = operation;
  }
}
