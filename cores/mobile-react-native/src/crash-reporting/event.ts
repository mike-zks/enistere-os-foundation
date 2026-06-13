/**
 * Bounded, redacted crash/error-report event model (RN 19 — crash reporting).
 *
 * Generic primitives for a **crash / error-reporting** layer: a normalised,
 * BOUNDED and REDACTED {@link CrashReportEvent} built from an arbitrary error or
 * message. The foundation ships GENERIC primitives only: NO real SDK
 * (Sentry/Crashlytics/Bugsnag/Firebase/OTel), NO network, NO persistence, NO
 * batching, NO global crash handler (mission). It does NOT decide ADR-019 — it is
 * a preparatory primitive.
 *
 * SECURITY (ADR-040 §17/§18/§19, ADR-015 §12/§21/§24, 07_SECURITY) — every field
 * is scrubbed through the CENTRAL RN 8 redaction (`redactValue`/`redactString`)
 * and BOUNDED before it leaves this module: NEVER a token/cookie/Authorization/
 * signed URL/device URI/PII/request-response body, NEVER a raw unfiltered stack
 * (the stack is redacted + bounded), NEVER a real user id. `describeCrashEventForLog`
 * exposes ONLY enums — no message/stack/context content.
 *
 * Every helper TOLERATES invalid input (returns a safe default, never throws).
 * PURE / framework-agnostic (no React/RN/ESM import; no `Date.now()`) → unit-tested
 * under `node --test`.
 */
import { REDACTED, isSensitiveKey, redactString, redactValue } from '../logger/redaction';

/** Severity of a reported event. */
export type CrashSeverity = 'fatal' | 'error' | 'warning' | 'info';

/** Where the event originated. */
export type CrashSource =
  | 'unhandled'
  | 'unhandledRejection'
  | 'caught'
  | 'manual'
  | 'unknown';

/** Bounded, redacted context bag — primitive values only (never PII/secrets). */
export type CrashContext = Readonly<Record<string, string | number | boolean>>;

/** A fully sanitised, immutable crash/error-report event. */
export interface CrashReportEvent {
  readonly severity: CrashSeverity;
  readonly source: CrashSource;
  /** Error name / short label (bounded). */
  readonly name: string;
  /** Redacted + bounded message. */
  readonly message: string;
  /** Redacted + bounded, line-capped stack (omitted when absent). */
  readonly stack?: string;
  /** Redacted + bounded context. */
  readonly context: CrashContext;
}

/** Safe log descriptor — enums ONLY (never message/stack/context content). */
export interface SafeCrashEventDescriptor {
  readonly severity: CrashSeverity;
  readonly source: CrashSource;
}

/** Raw input accepted by {@link createCrashReportEvent} (any shape tolerated). */
export interface CrashReportInput {
  readonly error?: unknown;
  readonly message?: unknown;
  readonly name?: unknown;
  readonly stack?: unknown;
  readonly severity?: unknown;
  readonly source?: unknown;
  readonly context?: unknown;
}

// --- Defensive bounds (a crash report is a diagnostic, not a data dump) ---------
export const MAX_NAME_LENGTH = 128;
export const MAX_MESSAGE_LENGTH = 1024;
export const MAX_STACK_LENGTH = 4096;
export const MAX_STACK_FRAMES = 50;
export const MAX_CONTEXT_KEYS = 32;
export const MAX_CONTEXT_VALUE_LENGTH = 256;

const SEVERITIES: ReadonlySet<CrashSeverity> = new Set([
  'fatal',
  'error',
  'warning',
  'info',
]);

const SOURCES: ReadonlySet<CrashSource> = new Set([
  'unhandled',
  'unhandledRejection',
  'caught',
  'manual',
  'unknown',
]);

const SEVERITY_ALIASES: Readonly<Record<string, CrashSeverity>> = {
  fatal: 'fatal',
  crash: 'fatal',
  critical: 'fatal',
  error: 'error',
  err: 'error',
  warning: 'warning',
  warn: 'warning',
  info: 'info',
  log: 'info',
};

const SOURCE_ALIASES: Readonly<Record<string, CrashSource>> = {
  unhandled: 'unhandled',
  uncaught: 'unhandled',
  global: 'unhandled',
  unhandledrejection: 'unhandledRejection',
  rejection: 'unhandledRejection',
  promise: 'unhandledRejection',
  caught: 'caught',
  handled: 'caught',
  manual: 'manual',
  message: 'manual',
  unknown: 'unknown',
};

/** Type guard for a normalised {@link CrashSeverity}. */
export function isCrashSeverity(value: unknown): value is CrashSeverity {
  return typeof value === 'string' && SEVERITIES.has(value as CrashSeverity);
}

/** Type guard for a normalised {@link CrashSource}. */
export function isCrashSource(value: unknown): value is CrashSource {
  return typeof value === 'string' && SOURCES.has(value as CrashSource);
}

/** Fold any raw value into a severity. Unknown/invalid → `error`. */
export function normalizeCrashSeverity(value: unknown): CrashSeverity {
  if (typeof value !== 'string') {
    return 'error';
  }
  const key = value.trim().toLowerCase();
  if (SEVERITIES.has(key as CrashSeverity)) {
    return key as CrashSeverity;
  }
  return SEVERITY_ALIASES[key] ?? 'error';
}

/** Fold any raw value into a source. Unknown/invalid → `unknown`. */
export function normalizeCrashSource(value: unknown): CrashSource {
  if (typeof value !== 'string') {
    return 'unknown';
  }
  const key = value.trim().toLowerCase();
  if (SOURCES.has(key as CrashSource)) {
    return key as CrashSource;
  }
  return SOURCE_ALIASES[key] ?? 'unknown';
}

/** Bound a string to `max` characters (safe on non-strings → ''). */
function boundString(value: unknown, max: number): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.length > max ? value.slice(0, max) : value;
}

/**
 * Redact + bound a free-text message. Always a string (never throws).
 */
export function sanitizeCrashMessage(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    return '';
  }
  return boundString(redactString(value), MAX_MESSAGE_LENGTH);
}

/**
 * Redact + bound a stack trace: scrub sensitive substrings (device paths,
 * tokens, signed URLs, emails) via RN 8 redaction, cap the number of frames and
 * the total length. Returns `undefined` when there is no usable stack. NEVER a
 * raw unfiltered stack (ADR-040 §19 / ADR-015 §21).
 */
export function sanitizeCrashStack(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }
  const redacted = redactString(value);
  const framed = redacted.split('\n').slice(0, MAX_STACK_FRAMES).join('\n');
  const bounded = boundString(framed, MAX_STACK_LENGTH);
  return bounded.length > 0 ? bounded : undefined;
}

/**
 * Build a bounded, redacted {@link CrashContext} from an arbitrary value:
 * - sensitive keys (token/cookie/email…) → `[Redacted]` (never dropped silently);
 * - string values → redacted + bounded;
 * - number/boolean → kept; bigint → string; everything else dropped;
 * - capped at {@link MAX_CONTEXT_KEYS}. Tolerates non-objects → `{}`.
 */
export function sanitizeCrashContext(value: unknown): CrashContext {
  const result: Record<string, string | number | boolean> = {};
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return Object.freeze(result);
  }
  let count = 0;
  for (const key of Object.keys(value as Record<string, unknown>)) {
    if (count >= MAX_CONTEXT_KEYS) {
      break;
    }
    const raw = (value as Record<string, unknown>)[key];
    if (isSensitiveKey(key)) {
      result[key] = REDACTED;
      count += 1;
      continue;
    }
    if (typeof raw === 'string') {
      result[key] = boundString(redactString(raw), MAX_CONTEXT_VALUE_LENGTH);
      count += 1;
    } else if (typeof raw === 'number' || typeof raw === 'boolean') {
      result[key] = raw;
      count += 1;
    } else if (typeof raw === 'bigint') {
      result[key] = `${raw}`;
      count += 1;
    }
    // non-primitive values are intentionally dropped (no nested dumps)
  }
  return Object.freeze(result);
}

/** Extract a safe `{ name, message, stack }` from an arbitrary thrown value. */
function describeError(error: unknown): { name?: unknown; message?: unknown; stack?: unknown } {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  if (typeof error === 'string') {
    return { message: error };
  }
  if (error && typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    return { name: obj.name, message: obj.message, stack: obj.stack };
  }
  return {};
}

/**
 * Build a fully sanitised, frozen {@link CrashReportEvent} from an arbitrary
 * input. Explicit fields win over fields derived from `error`. Never throws.
 */
export function createCrashReportEvent(input: CrashReportInput = {}): CrashReportEvent {
  const fromError = describeError(input.error);

  const rawName = input.name ?? fromError.name;
  const name = boundString(typeof rawName === 'string' ? rawName : '', MAX_NAME_LENGTH) || 'Error';

  const message = sanitizeCrashMessage(input.message ?? fromError.message);
  const stack = sanitizeCrashStack(input.stack ?? fromError.stack);

  const event: CrashReportEvent = {
    severity: normalizeCrashSeverity(input.severity),
    source: normalizeCrashSource(input.source),
    name,
    message,
    context: sanitizeCrashContext(input.context),
    ...(stack !== undefined ? { stack } : {}),
  };
  return Object.freeze(event);
}

/**
 * Defensive deep copy of a {@link CrashReportEvent} — re-runs context through
 * `redactValue` as a belt-and-braces second pass and returns a frozen clone, so
 * a stored/exposed event can never be mutated by reference.
 */
export function cloneCrashReportEvent(event: CrashReportEvent): CrashReportEvent {
  const context = Object.freeze(
    redactValue({ ...event.context }) as Record<string, string | number | boolean>,
  );
  return Object.freeze({
    severity: event.severity,
    source: event.source,
    name: event.name,
    message: event.message,
    context,
    ...(event.stack !== undefined ? { stack: event.stack } : {}),
  });
}

/** Safe log view — enums ONLY (never message/stack/context content). */
export function describeCrashEventForLog(event: CrashReportEvent): SafeCrashEventDescriptor {
  return { severity: event.severity, source: event.source };
}
