/**
 * Opt-in telemetry coordinator (RN 25).
 *
 * Explicitly composes RN 21 consent + RN 22 safe environment + RN 13 analytics
 * / RN 19 crash services. It never emits automatically: callers must invoke
 * `track`, `captureError` or `captureMessage`. It owns no SDK, no network, no
 * persistence and no identity. RN 24 retry/backoff is deliberately not used.
 */
import type { AnalyticsEventName, AnalyticsEventProperties } from '../analytics/event';
import type { AnalyticsService } from '../analytics/engine';
import type { AppEnvironmentService } from '../app-environment/service';
import type { ConsentCategory } from '../consent/model';
import type { ConsentService } from '../consent/service';
import type { CrashCaptureOptions, CrashReporterService } from '../crash-reporting/engine';
import type { Logger } from '../logger/logger';
import { buildTelemetryContext, type TelemetryContext } from './context';
import { getTelemetryConsentDecision } from './gate';

type Operation = 'track' | 'captureError' | 'captureMessage';

export interface TelemetryTrackInput {
  readonly name: AnalyticsEventName;
  readonly properties?: Readonly<Record<string, unknown>>;
}

export interface TelemetryEmissionResult {
  readonly operation: Operation;
  readonly category: ConsentCategory;
  readonly allowed: boolean;
  readonly emitted: boolean;
}

export interface TelemetryCoordinator {
  /** Opt-in analytics event emission; no-op unless `analytics` consent is granted. */
  track(event: TelemetryTrackInput): Promise<TelemetryEmissionResult>;
  /** Opt-in crash/error capture; no-op unless `crash` consent is granted. */
  captureError(error: unknown, options?: CrashCaptureOptions): Promise<TelemetryEmissionResult>;
  /** Opt-in crash/message capture; no-op unless `crash` consent is granted. */
  captureMessage(message: string, options?: CrashCaptureOptions): Promise<TelemetryEmissionResult>;
}

export interface TelemetryCoordinatorOptions {
  readonly consent: ConsentService;
  readonly environment: AppEnvironmentService;
  readonly analytics?: AnalyticsService;
  readonly crash?: CrashReporterService;
  /** Optional RN 8 logger; receives `{ operation, category, allowed }` only. */
  readonly logger?: Logger;
}

function result(
  operation: Operation,
  category: ConsentCategory,
  allowed: boolean,
  emitted: boolean,
): TelemetryEmissionResult {
  return Object.freeze({ operation, category, allowed, emitted });
}

function contextFromEnvironment(environment: AppEnvironmentService): TelemetryContext {
  try {
    return buildTelemetryContext(environment.getSnapshot());
  } catch {
    return buildTelemetryContext(null);
  }
}

function toAnalyticsProperties(
  properties: Readonly<Record<string, unknown>> | undefined,
  context: TelemetryContext,
): AnalyticsEventProperties | undefined {
  return { ...(properties ?? {}), ...context } as AnalyticsEventProperties;
}

function logDecision(
  logger: Logger | undefined,
  operation: Operation,
  category: ConsentCategory,
  allowed: boolean,
): void {
  logger?.debug('telemetry decision', { operation, category, allowed });
}

/** Build an opt-in coordinator. It performs no work until a method is called. */
export function createTelemetryCoordinator(
  options: TelemetryCoordinatorOptions,
): TelemetryCoordinator {
  const { consent, environment, analytics, crash, logger } = options;

  async function allowedFor(
    operation: Operation,
    category: ConsentCategory,
  ): Promise<boolean> {
    const decision = await getTelemetryConsentDecision(consent, category);
    logDecision(logger, operation, category, decision.allowed);
    return decision.allowed;
  }

  return {
    track: async (event) => {
      const operation: Operation = 'track';
      const category: ConsentCategory = 'analytics';
      const allowed = await allowedFor(operation, category);
      if (!allowed || !analytics) {
        return result(operation, category, allowed, false);
      }
      try {
        const context = contextFromEnvironment(environment);
        analytics.track(event.name, toAnalyticsProperties(event.properties, context));
        return result(operation, category, true, true);
      } catch {
        return result(operation, category, true, false);
      }
    },
    captureError: async (error, opts) => {
      const operation: Operation = 'captureError';
      const category: ConsentCategory = 'crash';
      const allowed = await allowedFor(operation, category);
      if (!allowed || !crash) {
        return result(operation, category, allowed, false);
      }
      try {
        const context = contextFromEnvironment(environment);
        crash.captureError(error, {
          ...(opts ?? {}),
          context: { ...(opts?.context ?? {}), ...context },
        });
        return result(operation, category, true, true);
      } catch {
        return result(operation, category, true, false);
      }
    },
    captureMessage: async (message, opts) => {
      const operation: Operation = 'captureMessage';
      const category: ConsentCategory = 'crash';
      const allowed = await allowedFor(operation, category);
      if (!allowed || !crash) {
        return result(operation, category, allowed, false);
      }
      try {
        const context = contextFromEnvironment(environment);
        crash.captureMessage(message, {
          ...(opts ?? {}),
          context: { ...(opts?.context ?? {}), ...context },
        });
        return result(operation, category, true, true);
      } catch {
        return result(operation, category, true, false);
      }
    },
  };
}
