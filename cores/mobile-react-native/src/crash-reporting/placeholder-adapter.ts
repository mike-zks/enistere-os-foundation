/**
 * In-memory placeholder crash-reporter adapter (RN 19 — crash reporting).
 *
 * A dependency-free {@link CrashReporterAdapter} for tests / wiring. It records
 * the sanitised events + context in memory and returns DEFENSIVE COPIES — NO real
 * SDK, NO network, NO persistence, NO batching (mission). A derived project
 * replaces it with a real adapter; the contract and the service stay identical.
 *
 * It stores only ALREADY-SANITISED events (the service redacts/bounds upstream)
 * and re-clones them on the way in and out, so neither the caller nor the
 * inspector can mutate the recorded state by reference.
 *
 * Agnostic (no React/RN import) → `node --test`-able.
 */
import type { CrashReporterAdapter } from './adapter';
import { cloneCrashReportEvent, type CrashContext, type CrashReportEvent } from './event';

/** A placeholder adapter with read-only inspectors for wiring/tests. */
export interface PlaceholderCrashReporterAdapter extends CrashReporterAdapter {
  /** Defensive copy of the captured error events. */
  getErrors(): CrashReportEvent[];
  /** Defensive copy of the captured message events. */
  getMessages(): CrashReportEvent[];
  /** Defensive copy of the current ambient context. */
  getContext(): CrashContext;
  /** Number of times `flush` was invoked. */
  readonly flushCount: number;
}

/** Create an in-memory placeholder crash-reporter adapter (no native dependency). */
export function createPlaceholderCrashReporterAdapter(): PlaceholderCrashReporterAdapter {
  const errors: CrashReportEvent[] = [];
  const messages: CrashReportEvent[] = [];
  let context: CrashContext = Object.freeze({});
  let flushes = 0;

  return {
    captureError: (event) => {
      errors.push(cloneCrashReportEvent(event));
    },
    captureMessage: (event) => {
      messages.push(cloneCrashReportEvent(event));
    },
    setContext: (next) => {
      context = Object.freeze({ ...next });
    },
    flush: () => {
      flushes += 1;
      return Promise.resolve();
    },
    getErrors: () => errors.map(cloneCrashReportEvent),
    getMessages: () => messages.map(cloneCrashReportEvent),
    getContext: () => Object.freeze({ ...context }),
    get flushCount() {
      return flushes;
    },
  };
}
