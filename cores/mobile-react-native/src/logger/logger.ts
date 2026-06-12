/**
 * Generic typed client logger (RN 8 — logger / observability).
 *
 * A tiny, dependency-free logging facade: `debug`/`info`/`warn`/`error`, a
 * pluggable {@link LogSink}, level filtering, optional `requestId` correlation
 * and CENTRAL redaction (every message + field set passes through
 * {@link redactValue}/{@link redactString} before it reaches the sink, so a token
 * or signed URL can never escape — even through a custom sink).
 *
 * Deliberately NOT provided (mission / ADR-040 §24): no persistence, no network
 * transport, no external observability service (Sentry/Datadog/Loki). The
 * default sink writes structured records to the platform `console`; a host app
 * may swap in its own sink. No request/response body is ever logged
 * automatically (ADR-040 §18) — the caller chooses which safe fields to pass.
 *
 * PURE / framework-agnostic (no React/RN import; the clock is injected, never
 * `Date.now()` in the tested path) → unit-tested under `node --test`.
 */
import { redactString, redactValue } from './redaction';

/** Severity levels, low → high. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/** True when `level` should be emitted given the `configured` threshold. */
export function isLevelEnabled(configured: LogLevel, level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[configured];
}

/** A structured, already-redacted log record handed to a {@link LogSink}. */
export interface LogRecord {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: number;
  /** Stable origin label (module/feature), e.g. `"upload"`. */
  readonly context?: string;
  /** Correlation id (ADR-040 §14) — e.g. an API `requestId`. Not a secret. */
  readonly requestId?: string;
  /** Extra structured, redacted fields. Never a raw body/payload. */
  readonly fields?: Record<string, unknown>;
}

/** Destination for a record. The default writes to `console`; swap freely. */
export type LogSink = (record: LogRecord) => void;

export interface LoggerOptions {
  /** Threshold (default `info`; set `debug` in development). */
  readonly level?: LogLevel;
  readonly context?: string;
  readonly requestId?: string;
  /** Base fields merged (then redacted) into every record. */
  readonly fields?: Record<string, unknown>;
  readonly sink?: LogSink;
  /** Injected clock (default `Date.now`); inject a fixed one in tests. */
  readonly clock?: () => number;
}

export interface Logger {
  debug(message: string, fields?: Record<string, unknown>): void;
  info(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
  error(message: string, fields?: Record<string, unknown>): void;
  /** Derive a logger with a nested `context` and optional extra base fields. */
  child(context: string, fields?: Record<string, unknown>): Logger;
  /** Derive a logger that stamps `requestId` on every record (correlation). */
  withRequestId(requestId: string): Logger;
}

/**
 * Default sink: one structured record per call on the matching console method.
 * `console` is the platform sink here (NOT a network transport); a host app may
 * replace it via {@link LoggerOptions.sink}.
 */
export const consoleSink: LogSink = (record) => {
  switch (record.level) {
    case 'error':
      console.error(record);
      break;
    case 'warn':
      console.warn(record);
      break;
    case 'debug':
      (console.debug ?? console.log)(record);
      break;
    default:
      (console.info ?? console.log)(record);
  }
};

/** Create a logger. All output is redacted; the sink/clock are injectable. */
export function createLogger(options: LoggerOptions = {}): Logger {
  const level = options.level ?? 'info';
  const sink = options.sink ?? consoleSink;
  const clock = options.clock ?? (() => Date.now());
  const { context, requestId, fields: baseFields } = options;

  function emit(level_: LogLevel, message: string, fields?: Record<string, unknown>): void {
    if (!isLevelEnabled(level, level_)) {
      return;
    }
    const rawFields =
      baseFields || fields ? { ...(baseFields ?? {}), ...(fields ?? {}) } : undefined;
    const redacted = rawFields
      ? (redactValue(rawFields) as Record<string, unknown>)
      : undefined;
    const record: LogRecord = {
      level: level_,
      message: redactString(message),
      timestamp: clock(),
      ...(context !== undefined ? { context } : {}),
      ...(requestId !== undefined ? { requestId } : {}),
      ...(redacted && Object.keys(redacted).length > 0 ? { fields: redacted } : {}),
    };
    sink(record);
  }

  return {
    debug: (message, fields) => emit('debug', message, fields),
    info: (message, fields) => emit('info', message, fields),
    warn: (message, fields) => emit('warn', message, fields),
    error: (message, fields) => emit('error', message, fields),
    child: (childContext, childFields) =>
      createLogger({
        level,
        sink,
        clock,
        requestId,
        context: context ? `${context}:${childContext}` : childContext,
        fields:
          baseFields || childFields
            ? { ...(baseFields ?? {}), ...(childFields ?? {}) }
            : undefined,
      }),
    withRequestId: (id) =>
      createLogger({ level, sink, clock, context, fields: baseFields, requestId: id }),
  };
}
