/**
 * In-memory placeholder analytics adapter (RN 13 — analytics / telemetry).
 *
 * A dependency-free {@link AnalyticsAdapter} FOR TESTS / wiring only. It buffers
 * the (already sanitised) events in memory — NO real SDK, NO network, NO
 * persistence (mission). A derived project replaces it with a real adapter
 * behind an ADR; the contract and the service stay identical.
 *
 * Agnostic (no React/RN import) → `node --test`-able.
 */
import type { AnalyticsAdapter } from './adapter';
import type { AnalyticsEvent } from './event';

/** A placeholder adapter exposing its in-memory buffer for assertions. */
export interface PlaceholderAnalyticsAdapter extends AnalyticsAdapter {
  /** The events recorded so far (defensive copy). */
  getEvents(): readonly AnalyticsEvent[];
  /** Drop all buffered events. */
  clear(): void;
}

/** Create an in-memory placeholder analytics adapter (no native dependency). */
export function createPlaceholderAnalyticsAdapter(): PlaceholderAnalyticsAdapter {
  const events: AnalyticsEvent[] = [];
  return {
    track(event: AnalyticsEvent): void {
      events.push(event);
    },
    async flush(): Promise<void> {
      // In-memory: nothing to send. Documented no-op (events are kept for tests).
    },
    getEvents(): readonly AnalyticsEvent[] {
      return [...events];
    },
    clear(): void {
      events.length = 0;
    },
  };
}
