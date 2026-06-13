/**
 * Framework-agnostic analytics service (RN 13 — analytics / telemetry).
 *
 * Sanitises every event ({@link sanitizeAnalyticsEvent}) BEFORE handing it to a
 * {@link AnalyticsAdapter}, so no sensitive property/value can reach the sink. It
 * is **best-effort and non-intrusive**: a failing adapter NEVER breaks the app
 * flow — the error is caught and a safe `warn` is logged (no sensitive cause).
 *
 * Logging (ADR-040 / RN 8) : optional injected logger; logs ONLY safe fields
 * (`{ eventName, propertyCount }` — NEVER property values) and never bypasses the
 * central redaction. NO network, NO persistence, NO real SDK, NO user identity.
 *
 * PURE / framework-agnostic (no React/RN import; no `Date.now()`) → `node --test`.
 */
import type { Logger } from '../logger/logger';
import type { AnalyticsAdapter } from './adapter';
import {
  describeAnalyticsEventForLog,
  sanitizeAnalyticsEvent,
  type AnalyticsEventName,
} from './event';

export interface AnalyticsService {
  /** Track an event by name. Properties are sanitised; never throws. */
  track(name: AnalyticsEventName, properties?: Readonly<Record<string, unknown>>): void;
  /** Flush the adapter if it supports it (best-effort; never throws). */
  flush(): Promise<void>;
}

export interface AnalyticsServiceOptions {
  readonly adapter: AnalyticsAdapter;
  /** Optional RN 8 logger (safe fields only). */
  readonly logger?: Logger;
}

/** Build an {@link AnalyticsService} over an adapter (+ optional safe logger). */
export function createAnalyticsService(options: AnalyticsServiceOptions): AnalyticsService {
  const { adapter, logger } = options;

  function track(name: AnalyticsEventName, properties?: Readonly<Record<string, unknown>>): void {
    const event = sanitizeAnalyticsEvent({ name, properties });
    try {
      adapter.track(event);
      logger?.debug('analytics event tracked', { ...describeAnalyticsEventForLog(event) });
    } catch {
      // Best-effort: a tracking failure must never break the app flow.
      logger?.warn('analytics track failed', { eventName: event.name });
    }
  }

  async function flush(): Promise<void> {
    if (!adapter.flush) {
      return;
    }
    try {
      await adapter.flush();
    } catch {
      logger?.warn('analytics flush failed');
    }
  }

  return { track, flush };
}
