/**
 * Framework-agnostic crash-reporter service (RN 19 — crash reporting).
 *
 * A thin, **best-effort and non-intrusive** wrapper over a
 * {@link CrashReporterAdapter}: it SANITISES every error/message/context into a
 * bounded, redacted {@link CrashReportEvent} (RN 8 redaction) and forwards it to
 * the adapter. It NEVER breaks the app flow — a failing or async-rejecting
 * adapter is caught and surfaced as an internal safe `warn` (never re-thrown,
 * never reported as a success).
 *
 * Deliberately NOT provided (mission / ADR-019 not decided): no real SDK
 * (Sentry/Crashlytics/Bugsnag/Firebase/OTel), no network, no persistence, no
 * batching, no global crash handler, no real `identify`/user-id.
 *
 * Logging (ADR-040 / RN 8) : optional injected logger; logs ONLY enums
 * (`{ operation, severity, source }` for captures, `{ operation }` for
 * setContext/flush) — never the message/stack/context content.
 *
 * PURE / framework-agnostic (no React/RN import; no `Date.now()`) → `node --test`.
 */
import type { Logger } from '../logger/logger';
import { CrashReporterAdapterError, type CrashReporterAdapter } from './adapter';
import {
  createCrashReportEvent,
  describeCrashEventForLog,
  sanitizeCrashContext,
  type CrashContext,
  type CrashReportEvent,
  type CrashSeverity,
  type CrashSource,
} from './event';

export interface CrashCaptureOptions {
  readonly severity?: CrashSeverity | string;
  readonly source?: CrashSource | string;
  readonly context?: Record<string, unknown>;
}

export interface CrashReporterService {
  /** Sanitise + report an arbitrary thrown value. Never throws. */
  captureError(error: unknown, options?: CrashCaptureOptions): void;
  /** Sanitise + report a free-text message. Never throws. */
  captureMessage(message: string, options?: CrashCaptureOptions): void;
  /** Merge + sanitise ambient context for subsequent reports. Never throws. */
  setContext(context: Record<string, unknown>): void;
  /** Best-effort flush (never rejects). */
  flush(): Promise<void>;
}

export interface CrashReporterServiceOptions {
  readonly adapter: CrashReporterAdapter;
  /** Optional RN 8 logger (enum fields only). */
  readonly logger?: Logger;
  /** Optional base context (sanitised). */
  readonly context?: Record<string, unknown>;
}

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return (
    value != null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

/** Build a {@link CrashReporterService} over an adapter (+ optional safe logger). */
export function createCrashReporterService(
  options: CrashReporterServiceOptions,
): CrashReporterService {
  const { adapter, logger } = options;
  let current: CrashContext = sanitizeCrashContext(options.context ?? {});

  /**
   * Report a pre-sanitised event through the adapter, best-effort: a sync throw
   * or an async rejection is caught and logged as `warn` (never a false success,
   * never re-thrown, never an unhandled rejection).
   */
  function report(
    operation: 'captureError' | 'captureMessage',
    event: CrashReportEvent,
    call: () => void | Promise<void>,
  ): void {
    const fields = { operation, ...describeCrashEventForLog(event) };
    try {
      const result = call();
      if (isPromiseLike(result)) {
        result.then(
          () => logger?.debug('crash reported', fields),
          () => logger?.warn('crash report failed', fields),
        );
        return;
      }
      logger?.debug('crash reported', fields);
    } catch {
      logger?.warn('crash report failed', fields);
    }
  }

  function buildEvent(
    base: { error?: unknown; message?: unknown },
    defaults: { severity: CrashSeverity; source: CrashSource },
    opts?: CrashCaptureOptions,
  ): CrashReportEvent {
    return createCrashReportEvent({
      ...base,
      severity: opts?.severity ?? defaults.severity,
      source: opts?.source ?? defaults.source,
      context: { ...current, ...(opts?.context ?? {}) },
    });
  }

  return {
    captureError: (error, opts) => {
      const event = buildEvent({ error }, { severity: 'error', source: 'caught' }, opts);
      report('captureError', event, () => adapter.captureError(event));
    },
    captureMessage: (message, opts) => {
      const event = buildEvent({ message }, { severity: 'info', source: 'manual' }, opts);
      report('captureMessage', event, () => adapter.captureMessage(event));
    },
    setContext: (context) => {
      current = sanitizeCrashContext({ ...current, ...context });
      if (!adapter.setContext) {
        return;
      }
      const operation = new CrashReporterAdapterError('setContext').operation;
      try {
        const result = adapter.setContext(current);
        if (isPromiseLike(result)) {
          result.then(undefined, () => logger?.warn('crash setContext failed', { operation }));
        }
      } catch {
        logger?.warn('crash setContext failed', { operation });
      }
    },
    flush: async () => {
      if (!adapter.flush) {
        return;
      }
      try {
        await adapter.flush();
      } catch {
        logger?.warn('crash flush failed', {
          operation: new CrashReporterAdapterError('flush').operation,
        });
      }
    },
  };
}
