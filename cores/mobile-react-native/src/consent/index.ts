/**
 * Generic telemetry-consent / privacy-gate primitives (RN 21).
 *
 * A bounded category/status model with a **default-deny** gate (`isAllowed` is
 * `true` only for an explicit `granted`; `denied`/`unknown`/absent/invalid all
 * block), a consent-store seam (recommended persistence: RN 20 non-sensitive
 * preferences via `createPreferenceConsentStore`), an in-memory placeholder
 * store, and a best-effort, non-intrusive service (safe RN 8 logging — enum
 * fields only).
 *
 * GENERIC only — NO real analytics/crash SDK, NO network, NO consent UI, NO real
 * user id, NO PII. Preparatory primitive: it does NOT decide ADR-038, triggers
 * no send, and does not wire the analytics (RN 13) / crash (RN 19) services. A
 * future adapter consults `isAllowed` BEFORE emitting. See ARCHITECTURE §30.
 */
export {
  CONSENT_CATEGORIES,
  isConsentCategory,
  isConsentStatus,
  normalizeConsentCategory,
  normalizeConsentStatus,
  sanitizeConsentSet,
  isConsentGranted,
  isTelemetryAllowed,
  describeConsentEntryForLog,
  describeConsentForLog,
} from './model';
export type {
  ConsentCategory,
  ConsentStatus,
  ConsentSet,
  SafeConsentEntryDescriptor,
  SafeConsentSetDescriptor,
} from './model';

export { ConsentStoreError, createPreferenceConsentStore, consentKey, CONSENT_KEY_PREFIX } from './store';
export type { ConsentStore } from './store';

export { createPlaceholderConsentStore } from './placeholder-store';

export { createConsentService } from './service';
export type { ConsentService, ConsentServiceOptions } from './service';
