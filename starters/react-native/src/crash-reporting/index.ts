/**
 * Generic crash / error-reporting primitives (RN 19).
 *
 * A bounded, REDACTED crash-event model (severity/source/name/message/stack/
 * context — sanitised via the RN 8 central redaction), an agnostic adapter
 * contract (seam for a future Sentry/Crashlytics/Bugsnag), an in-memory
 * placeholder adapter (defensive copies), and a best-effort, non-intrusive
 * service (sanitise → forward, never throws, safe RN 8 logging — enum fields
 * only).
 *
 * GENERIC only — NO real SDK, NO network, NO persistence, NO batching, NO global
 * crash handler, NO real user id. Preparatory primitive: it does NOT decide
 * ADR-019. See ARCHITECTURE §28.
 */
export {
  isCrashSeverity,
  isCrashSource,
  normalizeCrashSeverity,
  normalizeCrashSource,
  sanitizeCrashMessage,
  sanitizeCrashStack,
  sanitizeCrashContext,
  createCrashReportEvent,
  cloneCrashReportEvent,
  describeCrashEventForLog,
  MAX_NAME_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_STACK_LENGTH,
  MAX_STACK_FRAMES,
  MAX_CONTEXT_KEYS,
  MAX_CONTEXT_VALUE_LENGTH,
} from './event';
export type {
  CrashSeverity,
  CrashSource,
  CrashContext,
  CrashReportEvent,
  CrashReportInput,
  SafeCrashEventDescriptor,
} from './event';

export { CrashReporterAdapterError } from './adapter';
export type { CrashReporterAdapter } from './adapter';

export { createPlaceholderCrashReporterAdapter } from './placeholder-adapter';
export type { PlaceholderCrashReporterAdapter } from './placeholder-adapter';

export { createCrashReporterService } from './engine';
export type {
  CrashReporterService,
  CrashReporterServiceOptions,
  CrashCaptureOptions,
} from './engine';
