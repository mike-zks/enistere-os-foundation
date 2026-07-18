/**
 * Analytics adapter contract (RN 13 — analytics / telemetry).
 *
 * The seam between the agnostic {@link AnalyticsService} and a platform sink. The
 * foundation ships only the contract + an in-memory placeholder — NO real SDK
 * (Sentry/Amplitude/GA/Segment/Firebase/OTel), NO network, NO persistence. A
 * derived project wires a real adapter AFTER an ADR/validation.
 *
 * NO `identify` method — by design: the foundation must NOT carry a real user
 * identifier (mission). A derived project that needs identity adds it in its own
 * adapter, under its own privacy review.
 *
 * `track` receives an ALREADY-SANITISED {@link AnalyticsEvent} (sensitive keys
 * dropped, values scrubbed/bounded). Agnostic (no React/RN import).
 */
import type { AnalyticsEvent } from './event';

export interface AnalyticsAdapter {
  /** Record a sanitised event (synchronous, fire-and-forget). */
  track(event: AnalyticsEvent): void;
  /** Optionally flush buffered events (e.g. before backgrounding). */
  flush?(): Promise<void>;
}
