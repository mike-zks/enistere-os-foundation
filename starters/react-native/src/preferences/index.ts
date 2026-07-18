/**
 * Generic non-sensitive persisted-preference primitives (RN 20).
 *
 * A bounded preference model (`boolean`/`string`/`number`) with an anti-secret
 * guard (reuses the RN 8 `isSensitiveKey` + redaction), an agnostic store
 * contract (seam for a future MMKV/AsyncStorage), an in-memory placeholder store
 * (defensive copies), and a best-effort, non-intrusive service (guards writes /
 * sanitises reads, safe RN 8 logging — `{ operation, count? }` only).
 *
 * GENERIC only — NO real MMKV, NO real AsyncStorage, NO SecureStore (secrets), NO
 * Zustand persistence, NO network, NO business logic. Persisted NON-SENSITIVE
 * data ONLY — distinct from SecureStore (secrets), the RN 6 Zustand store
 * (in-memory UI state) and TanStack Query (server-state). See ARCHITECTURE §29.
 */
export {
  isSensitiveKey,
  isValidPreferenceKey,
  normalizePreferenceValue,
  isSensitivePreferenceValue,
  sanitizePreferenceSet,
  getPreferenceValue,
  getBooleanPreference,
  getStringPreference,
  getNumberPreference,
  describePreferencesForLog,
  MAX_PREFERENCE_KEY_LENGTH,
  MAX_PREFERENCE_VALUE_LENGTH,
  MAX_PREFERENCES,
} from './model';
export type { PreferenceValue, PreferenceSet, SafePreferencesDescriptor } from './model';

export { PreferenceStoreError } from './adapter';
export type { PreferenceStore } from './adapter';

export { createPlaceholderPreferenceStore } from './placeholder-store';
export type { PlaceholderPreferenceStore } from './placeholder-store';

export { createPreferenceService } from './service';
export type { PreferenceService, PreferenceServiceOptions } from './service';
