/**
 * Framework-agnostic telemetry-consent service (RN 21 — consent).
 *
 * A **best-effort, non-intrusive** privacy gate over a {@link ConsentStore}. Its
 * sole job is to answer "is this telemetry category allowed to emit?" with a
 * **default-deny** rule: `isAllowed` is `true` ONLY for an explicit `granted`;
 * `denied`, `unknown` (not yet decided), an absent category and any invalid
 * input all BLOCK. It NEVER throws — a failing store falls back to `unknown`
 * (i.e. NOT allowed), which is the safe privacy default.
 *
 * Deliberately NOT provided (mission / ADR-038 not decided): no real
 * analytics/crash SDK, no network, no consent UI, no real user id, no PII. This
 * service is meant to be consulted by a future analytics (RN 13) / crash (RN 19)
 * adapter BEFORE emitting — it triggers no send itself and does not wire those
 * services.
 *
 * Logging (ADR-040 / RN 8): only enums (`{ operation, category, status }`) or a
 * `{ operation, count }` — never a user value.
 *
 * PURE / framework-agnostic (no React/RN import; no `Date.now()`) → `node --test`.
 */
import type { Logger } from '../logger/logger';
import { ConsentStoreError, type ConsentStore } from './store';
import {
  describeConsentForLog,
  normalizeConsentCategory,
  normalizeConsentStatus,
  sanitizeConsentSet,
  type ConsentCategory,
  type ConsentSet,
  type ConsentStatus,
} from './model';

export interface ConsentService {
  /** Current status for a category (`unknown` if absent/invalid/on error). */
  get(category: ConsentCategory | string): Promise<ConsentStatus>;
  /** Persist a category's status (no-op on an unknown category). */
  set(category: ConsentCategory | string, status: ConsentStatus | string): Promise<void>;
  /** The gate: `true` ONLY when the category is explicitly `granted`. */
  isAllowed(category: ConsentCategory | string): Promise<boolean>;
  /** The full sanitised consent set (a copy). */
  getAll(): Promise<ConsentSet>;
  /** Clear all consent decisions. */
  clear(): Promise<void>;
  /** Observe sanitised changes; returns an unsubscribe function. */
  subscribe(listener: (set: ConsentSet) => void): () => void;
}

export interface ConsentServiceOptions {
  readonly store: ConsentStore;
  /** Optional RN 8 logger (enum fields only). */
  readonly logger?: Logger;
}

/** Build a {@link ConsentService} over a store (+ optional safe logger). */
export function createConsentService(options: ConsentServiceOptions): ConsentService {
  const { store, logger } = options;

  async function get(category: ConsentCategory | string): Promise<ConsentStatus> {
    const normalized = normalizeConsentCategory(category);
    if (normalized === undefined) {
      return 'unknown';
    }
    try {
      return normalizeConsentStatus(await store.get(normalized));
    } catch {
      logger?.warn('consent get failed', { operation: new ConsentStoreError('get').operation });
      return 'unknown';
    }
  }

  const listeners = new Set<(set: ConsentSet) => void>();
  if (store.subscribe) {
    try {
      store.subscribe((raw) => {
        const sanitised = sanitizeConsentSet(raw);
        logger?.debug('consent changed', { operation: 'subscribe', ...describeConsentForLog(sanitised) });
        for (const listener of listeners) {
          try {
            listener(sanitised);
          } catch {
            logger?.warn('consent listener failed', { operation: 'subscribe' });
          }
        }
      });
    } catch {
      logger?.warn('consent subscribe failed', {
        operation: new ConsentStoreError('subscribe').operation,
      });
    }
  }

  return {
    get,
    set: async (category, status) => {
      const normalizedCategory = normalizeConsentCategory(category);
      if (normalizedCategory === undefined) {
        // Unknown categories are ignored — never recorded, never allowed.
        logger?.warn('consent set ignored', { operation: 'set' });
        return;
      }
      const normalizedStatus = normalizeConsentStatus(status);
      try {
        await store.set(normalizedCategory, normalizedStatus);
        logger?.debug('consent set', {
          operation: 'set',
          category: normalizedCategory,
          status: normalizedStatus,
        });
      } catch {
        logger?.warn('consent set failed', { operation: new ConsentStoreError('set').operation });
      }
    },
    isAllowed: async (category) => (await get(category)) === 'granted',
    getAll: async () => {
      try {
        const sanitised = sanitizeConsentSet(await store.getAll());
        logger?.debug('consent read', { operation: 'getAll', ...describeConsentForLog(sanitised) });
        return sanitised;
      } catch {
        logger?.warn('consent getAll failed', {
          operation: new ConsentStoreError('getAll').operation,
        });
        return Object.freeze({});
      }
    },
    clear: async () => {
      try {
        await store.clear();
      } catch {
        logger?.warn('consent clear failed', { operation: new ConsentStoreError('clear').operation });
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
