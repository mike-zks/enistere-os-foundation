/**
 * Safe telemetry context composition (RN 25 - telemetry coordinator).
 *
 * Builds a bounded, NON-IDENTIFYING context from the RN 22 app-environment
 * snapshot. This module reads only the RN 22 allow-listed fields and emits only
 * primitive values, so no device/user identifier, token, URL, body or PII can be
 * introduced here. No network, no persistence, no SDK, no `Date.now()`.
 */
import {
  sanitizeAppEnvironmentSnapshot,
  type AppEnvironmentSnapshot,
  type AppOs,
  type AppRuntimeEnvironment,
} from '../app-environment/model';

export interface TelemetryContext {
  readonly os: AppOs;
  readonly osVersionMajor?: number;
  readonly appVersion?: string;
  readonly buildNumber?: string;
  readonly buildChannel?: string;
  readonly locale?: string;
  readonly environment?: AppRuntimeEnvironment;
}

export interface SafeTelemetryContextDescriptor {
  readonly fieldCount: number;
  readonly os: AppOs;
  readonly environment?: AppRuntimeEnvironment;
}

/** Build a frozen telemetry context from an RN 22 snapshot or raw input. */
export function buildTelemetryContext(snapshot: unknown): TelemetryContext {
  const safe: AppEnvironmentSnapshot = sanitizeAppEnvironmentSnapshot(snapshot);
  return Object.freeze({
    os: safe.os,
    ...(safe.osVersionMajor !== undefined ? { osVersionMajor: safe.osVersionMajor } : {}),
    ...(safe.appVersion !== undefined ? { appVersion: safe.appVersion } : {}),
    ...(safe.buildNumber !== undefined ? { buildNumber: safe.buildNumber } : {}),
    ...(safe.buildChannel !== undefined ? { buildChannel: safe.buildChannel } : {}),
    ...(safe.locale !== undefined ? { locale: safe.locale } : {}),
    ...(safe.environment !== undefined ? { environment: safe.environment } : {}),
  });
}

/** Alias kept for callers that prefer noun-style construction. */
export const createTelemetryContext = buildTelemetryContext;

/** Safe log view: count + coarse enums only, never values such as versions/locales. */
export function describeTelemetryContextForLog(
  context: TelemetryContext,
): SafeTelemetryContextDescriptor {
  return {
    fieldCount: Object.keys(context).length,
    os: context.os,
    ...(context.environment !== undefined ? { environment: context.environment } : {}),
  };
}
