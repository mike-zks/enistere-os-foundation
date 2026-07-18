/**
 * Generic analytics / telemetry primitives (RN 13).
 *
 * A safe, bounded analytics event model with a DEDICATED redaction built on RN 8
 * (`sanitizeAnalyticsEvent` drops sensitive keys + scrubs values), an agnostic
 * adapter contract (NO `identify`), a best-effort service (safe RN 8 logging,
 * non-intrusive errors) and an in-memory placeholder adapter. GENERIC only — NO
 * real SDK, NO network, NO persistence, NO user identity; derived projects plug a
 * real SDK behind an adapter AFTER an ADR. See ARCHITECTURE §22.
 */
export {
  MAX_EVENT_NAME_LENGTH,
  MAX_PROPERTIES,
  MAX_PROPERTY_VALUE_LENGTH,
  isSensitiveProperty,
  sanitizeAnalyticsEvent,
  describeAnalyticsEventForLog,
} from './event';
export type {
  AnalyticsEventName,
  AnalyticsPropertyValue,
  AnalyticsEventProperties,
  AnalyticsEvent,
  SafeAnalyticsDescriptor,
} from './event';

export type { AnalyticsAdapter } from './adapter';

export { createAnalyticsService } from './engine';
export type { AnalyticsService, AnalyticsServiceOptions } from './engine';

export { createPlaceholderAnalyticsAdapter } from './placeholder-adapter';
export type { PlaceholderAnalyticsAdapter } from './placeholder-adapter';
