/**
 * Non-sensitive persisted-preference model (RN 20 — preferences).
 *
 * Generic primitives for a **persisted, NON-SENSITIVE** preference layer
 * (ADR-015 §15/§16): bounded keys/values + an anti-secret guard that reuses the
 * RN 8 central redaction. The foundation ships GENERIC primitives only: NO real
 * MMKV, NO real AsyncStorage, NO SecureStore (secrets), NO Zustand persistence,
 * NO network, NO business logic (mission).
 *
 * LAYERING (ADR-015 / ADR-012) — these are distinct on purpose:
 * - SecureStore (RN 1/2)      → secrets (refresh token…).
 * - Preferences (RN 20, here) → persisted NON-SENSITIVE data (theme, locale,
 *   onboarding-seen, non-sensitive filters).
 * - Zustand store (RN 6)      → in-memory UI/local state (not persisted).
 * - TanStack Query (RN 5)     → server-state (never persisted here).
 *
 * SECURITY (ADR-015 §11/§17/§21, 07_SECURITY) — a preference is NEVER a secret:
 * a sensitive KEY (token/cookie/email…) is rejected, and a string VALUE that the
 * RN 8 redaction would alter (Bearer/JWT/signed URL/device URI/email…) is
 * DROPPED rather than persisted masked. `describePreferencesForLog` exposes ONLY
 * a `{ count }` — never a key or value.
 *
 * Every helper TOLERATES invalid input (returns a safe default, never throws).
 * PURE / framework-agnostic (no React/RN/ESM import; no `Date.now()`) → unit-tested
 * under `node --test`.
 */
import { isSensitiveKey, redactString } from '../logger/redaction';

/** A persisted preference value — primitives only (never an object/secret). */
export type PreferenceValue = boolean | string | number;

/** A normalised, immutable set of preferences. */
export type PreferenceSet = Readonly<Record<string, PreferenceValue>>;

/** Safe log descriptor — a count ONLY (never keys or values). */
export interface SafePreferencesDescriptor {
  readonly count: number;
}

// --- Defensive bounds -----------------------------------------------------------
export const MAX_PREFERENCE_KEY_LENGTH = 64;
export const MAX_PREFERENCE_VALUE_LENGTH = 1024;
export const MAX_PREFERENCES = 200;

/** Allowed key shape: starts alphanumeric, then `[A-Za-z0-9._-]`. */
const KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/** Re-exported from the central redaction so the guard is never duplicated. */
export { isSensitiveKey } from '../logger/redaction';

/**
 * True when `key` is a usable preference key: a bounded identifier that is NOT
 * sensitive (a sensitive key is never a valid preference key — ADR-015 §17/§21).
 */
export function isValidPreferenceKey(key: unknown): key is string {
  return (
    typeof key === 'string' &&
    key.length > 0 &&
    key.length <= MAX_PREFERENCE_KEY_LENGTH &&
    KEY_PATTERN.test(key) &&
    !isSensitiveKey(key)
  );
}

/**
 * Coerce a raw value into a {@link PreferenceValue}: booleans as-is, finite
 * numbers, strings bounded to {@link MAX_PREFERENCE_VALUE_LENGTH}. Anything else
 * (object/array/function/NaN/Infinity/null/undefined) → `undefined`.
 */
export function normalizePreferenceValue(value: unknown): PreferenceValue | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    return value.length > MAX_PREFERENCE_VALUE_LENGTH
      ? value.slice(0, MAX_PREFERENCE_VALUE_LENGTH)
      : value;
  }
  return undefined;
}

/**
 * True when a (normalised) value must NOT be persisted as a preference: a string
 * whose content the RN 8 redaction would alter (Bearer/JWT/signed URL/device
 * URI/email…). Numbers/booleans are never sensitive. The strategy is to DROP
 * such a value (never persist a masked secret) — ADR-015 §17/§21.
 */
export function isSensitivePreferenceValue(value: PreferenceValue): boolean {
  return typeof value === 'string' && redactString(value) !== value;
}

/**
 * Keep only valid, non-sensitive key/value pairs (capped at
 * {@link MAX_PREFERENCES}); tolerate any invalid input → `{}`. Defence-in-depth
 * applied to whatever a store returns, so a stray secret never surfaces.
 */
export function sanitizePreferenceSet(value: unknown): PreferenceSet {
  const result: Record<string, PreferenceValue> = {};
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return Object.freeze(result);
  }
  let count = 0;
  for (const key of Object.keys(value as Record<string, unknown>)) {
    if (count >= MAX_PREFERENCES) {
      break;
    }
    if (!isValidPreferenceKey(key)) {
      continue;
    }
    const normalized = normalizePreferenceValue((value as Record<string, unknown>)[key]);
    if (normalized === undefined || isSensitivePreferenceValue(normalized)) {
      continue;
    }
    result[key] = normalized;
    count += 1;
  }
  return Object.freeze(result);
}

function matchesType<T extends PreferenceValue>(value: PreferenceValue, sample: T): value is T {
  return typeof value === typeof sample;
}

/** Read a typed preference, returning `defaultValue` if absent or mistyped. */
export function getPreferenceValue<T extends PreferenceValue>(
  set: PreferenceSet,
  key: string,
  defaultValue: T,
): T {
  const value = set[key];
  return value !== undefined && matchesType(value, defaultValue) ? value : defaultValue;
}

/** Read a boolean preference (safe default on absence/type mismatch). */
export function getBooleanPreference(set: PreferenceSet, key: string, defaultValue: boolean): boolean {
  return getPreferenceValue(set, key, defaultValue);
}

/** Read a string preference (safe default on absence/type mismatch). */
export function getStringPreference(set: PreferenceSet, key: string, defaultValue: string): string {
  return getPreferenceValue(set, key, defaultValue);
}

/** Read a number preference (safe default on absence/type mismatch). */
export function getNumberPreference(set: PreferenceSet, key: string, defaultValue: number): number {
  return getPreferenceValue(set, key, defaultValue);
}

/** Safe log view — a count ONLY (never a key or value). */
export function describePreferencesForLog(set: PreferenceSet): SafePreferencesDescriptor {
  return { count: Object.keys(set).length };
}
