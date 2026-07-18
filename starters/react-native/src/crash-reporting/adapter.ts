/**
 * Crash-reporter adapter contract (RN 19 — crash reporting).
 *
 * The seam between the agnostic {@link CrashReporterService} and a future real
 * reporter (Sentry/Crashlytics/Bugsnag/…). The foundation ships only the contract
 * + an in-memory placeholder — NO real SDK, NO network, NO persistence, NO
 * batching (mission). A derived project wires a real adapter under ADR-019.
 *
 * The adapter only ever receives an ALREADY-SANITISED {@link CrashReportEvent}
 * (the service redacts/bounds before calling it), so a raw error, token, stack
 * or PII can never reach a reporter through this seam.
 *
 * Agnostic (no React/RN import) → `node --test`-able.
 */
import type { CrashContext, CrashReportEvent } from './event';

export interface CrashReporterAdapter {
  /** Report a sanitised error event. */
  captureError(event: CrashReportEvent): void | Promise<void>;
  /** Report a sanitised message event. */
  captureMessage(event: CrashReportEvent): void | Promise<void>;
  /** Set ambient (sanitised) context for subsequent reports. */
  setContext?(context: CrashContext): void | Promise<void>;
  /** Best-effort flush of any buffered reports. */
  flush?(): Promise<void>;
}

/**
 * Controlled error for a failed adapter operation. Carries only the safe
 * `operation` — NO underlying message/cause (no sensitive leak, ADR-040 §19).
 */
export class CrashReporterAdapterError extends Error {
  readonly operation: 'captureError' | 'captureMessage' | 'setContext' | 'flush';

  constructor(operation: 'captureError' | 'captureMessage' | 'setContext' | 'flush') {
    super(`Crash reporter adapter "${operation}" failed.`);
    this.name = 'CrashReporterAdapterError';
    this.operation = operation;
  }
}
