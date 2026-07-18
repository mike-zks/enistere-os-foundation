/**
 * Consent-store seam + preference-backed adapter (RN 21 — consent).
 *
 * The seam between the agnostic {@link ConsentService} and a persistence layer.
 * The recommended persistence is RN 20 **non-sensitive preferences**
 * ({@link createPreferenceConsentStore}) — a consent decision (granted/denied)
 * is non-sensitive config, NOT a secret. Keys are prefixed `privacy.consent.<cat>`
 * (valid + non-sensitive preference keys). NO network, NO secret, NO direct
 * storage that bypasses RN 20 (mission).
 *
 * Operations are async (the preference store is async). Agnostic (no React/RN
 * import) → `node --test`-able.
 */
import type { PreferenceService } from '../preferences';
import {
  CONSENT_CATEGORIES,
  normalizeConsentStatus,
  sanitizeConsentSet,
  type ConsentCategory,
  type ConsentSet,
  type ConsentStatus,
} from './model';

/** Prefix for consent preference keys (non-sensitive, RN 20-valid). */
export const CONSENT_KEY_PREFIX = 'privacy.consent.';

/** The preference key for a category, e.g. `privacy.consent.analytics`. */
export function consentKey(category: ConsentCategory): string {
  return `${CONSENT_KEY_PREFIX}${category}`;
}

export interface ConsentStore {
  /** Current status for a category (`unknown` when not yet decided). */
  get(category: ConsentCategory): Promise<ConsentStatus>;
  /** Persist a category's status (`unknown` removes the entry). */
  set(category: ConsentCategory, status: ConsentStatus): Promise<void>;
  /** The full (sanitised) consent set. */
  getAll(): Promise<ConsentSet>;
  /** Clear ALL consent entries (only the `privacy.consent.*` keys). */
  clear(): Promise<void>;
  /** Observe changes (optional); returns an unsubscribe function. */
  subscribe?(listener: (set: ConsentSet) => void): () => void;
}

/**
 * Controlled error for a failed store operation. Carries only the safe
 * `operation` — NO category, status or underlying cause.
 */
export class ConsentStoreError extends Error {
  readonly operation: 'get' | 'set' | 'getAll' | 'clear' | 'subscribe';

  constructor(operation: 'get' | 'set' | 'getAll' | 'clear' | 'subscribe') {
    super(`Consent store "${operation}" failed.`);
    this.name = 'ConsentStoreError';
    this.operation = operation;
  }
}

/** Build a category → preference-key lookup for change mapping. */
const KEY_TO_CATEGORY: ReadonlyMap<string, ConsentCategory> = new Map(
  CONSENT_CATEGORIES.map((category) => [consentKey(category), category]),
);

/**
 * Adapt a RN 20 {@link PreferenceService} into a {@link ConsentStore}. Consent
 * decisions persist as non-sensitive `privacy.consent.<category>` preferences
 * (string status). `clear()` removes ONLY the consent keys (never the whole
 * preference store). The preference service is itself best-effort, so this
 * adapter inherits its non-throwing behaviour.
 */
export function createPreferenceConsentStore(preferences: PreferenceService): ConsentStore {
  return {
    get: async (category) => {
      const raw = await preferences.get(consentKey(category));
      return raw === undefined ? 'unknown' : normalizeConsentStatus(raw);
    },
    set: async (category, status) => {
      const normalized = normalizeConsentStatus(status);
      if (normalized === 'unknown') {
        await preferences.remove(consentKey(category));
        return;
      }
      await preferences.set(consentKey(category), normalized);
    },
    getAll: async () => {
      const raw: Record<string, string> = {};
      for (const category of CONSENT_CATEGORIES) {
        const value = await preferences.get(consentKey(category));
        if (typeof value === 'string') {
          raw[category] = value;
        }
      }
      return sanitizeConsentSet(raw);
    },
    clear: async () => {
      for (const category of CONSENT_CATEGORIES) {
        await preferences.remove(consentKey(category));
      }
    },
    subscribe: (listener) =>
      preferences.subscribe((prefs) => {
        const raw: Record<string, ConsentStatus> = {};
        for (const [key, value] of Object.entries(prefs)) {
          const category = KEY_TO_CATEGORY.get(key);
          if (category && typeof value === 'string') {
            raw[category] = normalizeConsentStatus(value);
          }
        }
        listener(sanitizeConsentSet(raw));
      }),
  };
}
