/**
 * Telemetry composition primitives (RN 25).
 *
 * Opt-in coordinator for RN 21 consent + RN 22 safe app environment + RN 13
 * analytics / RN 19 crash services. No automatic emission, no SDK, no network,
 * no persistence, no identity, no RN 24 retry wiring.
 */
export {
  buildTelemetryContext,
  createTelemetryContext,
  describeTelemetryContextForLog,
} from './context';
export type { SafeTelemetryContextDescriptor, TelemetryContext } from './context';

export { getTelemetryConsentDecision, isTelemetryCategoryAllowed } from './gate';
export type { TelemetryConsentDecision } from './gate';

export { createTelemetryCoordinator } from './telemetry-service';
export type {
  TelemetryCoordinator,
  TelemetryCoordinatorOptions,
  TelemetryEmissionResult,
  TelemetryTrackInput,
} from './telemetry-service';

