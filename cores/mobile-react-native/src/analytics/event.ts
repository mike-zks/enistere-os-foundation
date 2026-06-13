/**
 * Analytics event model + redaction (RN 13 — analytics / telemetry).
 *
 * A safe, bounded analytics event. The foundation ships GENERIC primitives only:
 * NO real SDK (Sentry/Amplitude/GA/Segment/Firebase/OTel), NO network, NO
 * persistence, NO real user identifier (mission). Derived projects plug a real
 * SDK behind an adapter AFTER an ADR/validation.
 *
 * SECURITY (07_SECURITY §13, ADR-015/040) — the redaction is DEDICATED but BUILT
 * ON RN 8 (`isSensitiveKey`/`redactString`) and must NOT be bypassed:
 * - **Sensitive keys are DROPPED** (token/secret/signature/credential/password/
 *   authorization/apiKey/auth/jwt/otp/key/code/sig/email/phone/…), with the same
 *   normalised + substring matching as the RN 12 link hardening.
 * - String values are scrubbed with RN 8 `redactString` (Bearer/JWT/device-uri/
 *   signed-URL params/email) and bounded; only primitives are kept.
 * - No `Authorization`/cookie/device token/signed URL/device URI ever survives.
 *
 * PURE / framework-agnostic (no React/RN/ESM import) → unit-tested under
 * `node --test`.
 */
import { isSensitiveKey, redactString } from '../logger/redaction';

/** Max kept characters of an event name. */
export const MAX_EVENT_NAME_LENGTH = 120;
/** Max kept properties. */
export const MAX_PROPERTIES = 32;
/** Max kept length of a string property value. */
export const MAX_PROPERTY_VALUE_LENGTH = 512;

/** A developer-defined event name (e.g. `screen_view`). */
export type AnalyticsEventName = string;

/** Allowed property value primitives (no nested objects, no functions). */
export type AnalyticsPropertyValue = string | number | boolean;

/** Safe, bounded analytics properties. */
export type AnalyticsEventProperties = Readonly<Record<string, AnalyticsPropertyValue>>;

/** A sanitised analytics event. */
export interface AnalyticsEvent {
  readonly name: AnalyticsEventName;
  readonly properties?: AnalyticsEventProperties;
  /** Optional epoch-ms set by the caller/SDK (never generated here). */
  readonly timestamp?: number;
}

function normaliseKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const SENSITIVE_SUBSTRINGS: readonly string[] = [
  'token',
  'secret',
  'signature',
  'credential',
  'password',
  'authorization',
  'apikey',
  'cookie',
  'sessionid',
];

const SENSITIVE_EXACT: ReadonlySet<string> = new Set([
  'key',
  'code',
  'sig',
  'otp',
  'jwt',
  'auth',
  'bearer',
  'email',
  'phone',
  'pin',
  'pwd',
  'pass',
  'ssn',
  'iban',
  'cvv',
  'cvc',
]);

/**
 * True when a property name is sensitive — REUSES RN 8 `isSensitiveKey`, plus a
 * normalised exact/substring layer (same hardening as the RN 12 link filter).
 */
export function isSensitiveProperty(name: string): boolean {
  if (isSensitiveKey(name)) {
    return true;
  }
  const normalised = normaliseKey(name);
  if (SENSITIVE_EXACT.has(normalised)) {
    return true;
  }
  return SENSITIVE_SUBSTRINGS.some((s) => normalised.includes(s));
}

function sanitizeName(name: unknown): string {
  if (typeof name !== 'string') {
    return 'unknown';
  }
  const trimmed = redactString(name.trim()).slice(0, MAX_EVENT_NAME_LENGTH);
  return trimmed.length > 0 ? trimmed : 'unknown';
}

function sanitizeProperties(properties: unknown): AnalyticsEventProperties | undefined {
  if (typeof properties !== 'object' || properties === null) {
    return undefined;
  }
  const out: Record<string, AnalyticsPropertyValue> = {};
  let kept = 0;
  for (const [key, value] of Object.entries(properties as Record<string, unknown>)) {
    if (kept >= MAX_PROPERTIES) {
      break;
    }
    if (isSensitiveProperty(key)) {
      continue; // sensitive key dropped entirely
    }
    if (typeof value === 'string') {
      out[key] = redactString(value).slice(0, MAX_PROPERTY_VALUE_LENGTH); // RN 8 scrub + bound
      kept += 1;
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      out[key] = value;
      kept += 1;
    } else if (typeof value === 'boolean') {
      out[key] = value;
      kept += 1;
    }
    // Non-primitive / NaN / null / undefined values are dropped.
  }
  return kept > 0 ? out : undefined;
}

/**
 * Coerce arbitrary input into a safe, bounded {@link AnalyticsEvent}. Drops
 * sensitive keys, scrubs/bounds values, keeps a numeric `timestamp` if provided.
 * Never throws.
 */
export function sanitizeAnalyticsEvent(input: unknown): AnalyticsEvent {
  const raw =
    typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const name = sanitizeName(raw.name);
  const properties = sanitizeProperties(raw.properties);
  const timestamp =
    typeof raw.timestamp === 'number' && Number.isFinite(raw.timestamp) ? raw.timestamp : undefined;

  const base: AnalyticsEvent = properties ? { name, properties } : { name };
  return timestamp !== undefined ? { ...base, timestamp } : base;
}

/** Safe, value-free descriptor of an event for logs — name + count only. */
export interface SafeAnalyticsDescriptor {
  readonly eventName: string;
  readonly propertyCount: number;
}

/** Reduce an event to non-sensitive log fields (NEVER the property values). */
export function describeAnalyticsEventForLog(event: AnalyticsEvent): SafeAnalyticsDescriptor {
  return {
    eventName: event.name,
    propertyCount: event.properties ? Object.keys(event.properties).length : 0,
  };
}
