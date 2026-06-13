/**
 * Telemetry consent / privacy-gate model (RN 21 — consent).
 *
 * Generic primitives for a **telemetry consent gate**: a bounded set of
 * categories, a tri-state status, and pure helpers to decide whether a category
 * is allowed to emit. The foundation ships GENERIC primitives only: NO real
 * analytics/crash SDK, NO network, NO consent UI, NO real user id, NO PII
 * (mission). It is a **preparatory** primitive — it does NOT decide ADR-038.
 *
 * PRIVACY RULE (default-deny): only `granted` allows; `denied` AND `unknown`
 * (not-yet-decided) both BLOCK. Unknown/invalid categories are normalised away
 * and never allowed. A future analytics (RN 13) / crash (RN 19) adapter is meant
 * to consult `isTelemetryAllowed` BEFORE emitting — this module emits nothing.
 *
 * Logging (ADR-040 / RN 8): only enums (`category`/`status`) or a `{ count }` —
 * never a user value (the categories/statuses ARE the only data, and they are a
 * closed enum set, not user content).
 *
 * Every helper TOLERATES invalid input (returns a safe default, never throws).
 * PURE / framework-agnostic (no React/RN/ESM import; no `Date.now()`) → unit-tested
 * under `node --test`.
 */

/** Telemetry categories that can be independently consented to. */
export type ConsentCategory = 'analytics' | 'crash' | 'performance' | 'diagnostics';

/** Tri-state consent. `unknown` = not yet decided (treated as NOT allowed). */
export type ConsentStatus = 'granted' | 'denied' | 'unknown';

/** A (partial) map of category → status. Absent categories default to `unknown`. */
export type ConsentSet = Readonly<Partial<Record<ConsentCategory, ConsentStatus>>>;

/** Safe log descriptor for a single consent entry — enums ONLY. */
export interface SafeConsentEntryDescriptor {
  readonly category: ConsentCategory;
  readonly status: ConsentStatus;
}

/** Safe log descriptor for a consent set — a count ONLY. */
export interface SafeConsentSetDescriptor {
  readonly count: number;
}

/** The closed set of known categories (order is stable for enumeration). */
export const CONSENT_CATEGORIES: readonly ConsentCategory[] = Object.freeze([
  'analytics',
  'crash',
  'performance',
  'diagnostics',
]);

const CATEGORIES: ReadonlySet<string> = new Set(CONSENT_CATEGORIES);
const STATUSES: ReadonlySet<ConsentStatus> = new Set(['granted', 'denied', 'unknown']);

const STATUS_ALIASES: Readonly<Record<string, ConsentStatus>> = {
  granted: 'granted',
  grant: 'granted',
  allowed: 'granted',
  allow: 'granted',
  accepted: 'granted',
  accept: 'granted',
  optin: 'granted',
  denied: 'denied',
  deny: 'denied',
  refused: 'denied',
  rejected: 'denied',
  blocked: 'denied',
  optout: 'denied',
  unknown: 'unknown',
  unset: 'unknown',
  pending: 'unknown',
};

/** Type guard for a normalised {@link ConsentCategory}. */
export function isConsentCategory(value: unknown): value is ConsentCategory {
  return typeof value === 'string' && CATEGORIES.has(value);
}

/** Type guard for a normalised {@link ConsentStatus}. */
export function isConsentStatus(value: unknown): value is ConsentStatus {
  return typeof value === 'string' && STATUSES.has(value as ConsentStatus);
}

/**
 * Fold a raw value into a known {@link ConsentCategory}, or `undefined` when it
 * is not one of the closed set (unknown categories are ignored, never allowed).
 */
export function normalizeConsentCategory(value: unknown): ConsentCategory | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const key = value.trim().toLowerCase();
  return CATEGORIES.has(key) ? (key as ConsentCategory) : undefined;
}

/**
 * Fold any raw value into a {@link ConsentStatus}. Unknown/invalid → `unknown`
 * (the default-deny state — never silently `granted`).
 */
export function normalizeConsentStatus(value: unknown): ConsentStatus {
  if (typeof value !== 'string') {
    return 'unknown';
  }
  const key = value.trim().toLowerCase();
  if (STATUSES.has(key as ConsentStatus)) {
    return key as ConsentStatus;
  }
  return STATUS_ALIASES[key] ?? 'unknown';
}

/**
 * Keep only known categories with a normalised status; tolerate any invalid
 * input → `{}`. An entry that normalises to `unknown` is dropped (absent ==
 * `unknown` == not allowed), keeping the set minimal.
 */
export function sanitizeConsentSet(value: unknown): ConsentSet {
  const result: Partial<Record<ConsentCategory, ConsentStatus>> = {};
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return Object.freeze(result);
  }
  for (const key of Object.keys(value as Record<string, unknown>)) {
    const category = normalizeConsentCategory(key);
    if (category === undefined) {
      continue;
    }
    const status = normalizeConsentStatus((value as Record<string, unknown>)[key]);
    if (status !== 'unknown') {
      result[category] = status;
    }
  }
  return Object.freeze(result);
}

/** True only for an explicit `granted`. */
export function isConsentGranted(status: unknown): boolean {
  return normalizeConsentStatus(status) === 'granted';
}

/**
 * The gate decision: `true` ONLY when the category is known AND its status in
 * `set` is `granted`. Absent/`unknown`/`denied`/invalid category → `false`
 * (default-deny).
 */
export function isTelemetryAllowed(set: ConsentSet, category: unknown): boolean {
  const normalized = normalizeConsentCategory(category);
  if (normalized === undefined) {
    return false;
  }
  return isConsentGranted(set[normalized]);
}

/** Safe log view of one entry — enums ONLY. */
export function describeConsentEntryForLog(
  category: ConsentCategory,
  status: ConsentStatus,
): SafeConsentEntryDescriptor {
  return { category, status };
}

/** Safe log view of a set — a count ONLY. */
export function describeConsentForLog(set: ConsentSet): SafeConsentSetDescriptor {
  return { count: Object.keys(set).length };
}
