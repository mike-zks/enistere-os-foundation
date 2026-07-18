/**
 * Framework-agnostic app-environment service (RN 22 — app environment).
 *
 * A thin, **best-effort and non-intrusive** wrapper over an
 * {@link AppEnvironmentAdapter}. It SANITISES whatever the adapter returns
 * through the strict allow-list ({@link sanitizeAppEnvironmentSnapshot}) and
 * exposes a frozen, NON-IDENTIFYING snapshot plus a flattened context object
 * suitable to attach LATER to telemetry. It NEVER throws — a failing adapter
 * yields a safe `{ os: 'unknown' }` snapshot.
 *
 * It stores NOTHING (no persistence) and triggers NO collection: it does NOT
 * wire analytics (RN 13) / crash (RN 19) and does NOT consult RN 21 consent — a
 * future telemetry adapter applies the consent gate before using this context.
 *
 * Logging (ADR-040 / RN 8): only `{ operation }` + the coarse
 * {@link describeAppEnvironmentForLog} fields — never an identifier or PII.
 *
 * PURE / framework-agnostic (no React/RN import; no `Date.now()`) → `node --test`.
 */
import type { Logger } from '../logger/logger';
import { AppEnvironmentAdapterError, type AppEnvironmentAdapter } from './adapter';
import {
  describeAppEnvironmentForLog,
  sanitizeAppEnvironmentSnapshot,
  type AppEnvironmentSnapshot,
} from './model';

export interface AppEnvironmentService {
  /** The current sanitised, non-identifying snapshot (frozen). */
  getSnapshot(): AppEnvironmentSnapshot;
  /** A flattened, frozen context object (defined fields only) for telemetry. */
  describeForContext(): Readonly<Record<string, string | number>>;
}

export interface AppEnvironmentServiceOptions {
  readonly adapter: AppEnvironmentAdapter;
  /** Optional RN 8 logger (coarse enum/number fields only). */
  readonly logger?: Logger;
}

const UNKNOWN_SNAPSHOT: AppEnvironmentSnapshot = sanitizeAppEnvironmentSnapshot(null);

/** Build an {@link AppEnvironmentService} over an adapter (+ optional safe logger). */
export function createAppEnvironmentService(
  options: AppEnvironmentServiceOptions,
): AppEnvironmentService {
  const { adapter, logger } = options;

  function getSnapshot(): AppEnvironmentSnapshot {
    try {
      const snapshot = sanitizeAppEnvironmentSnapshot(adapter.getSnapshot());
      logger?.debug('app environment read', {
        operation: 'getSnapshot',
        ...describeAppEnvironmentForLog(snapshot),
      });
      return snapshot;
    } catch {
      logger?.warn('app environment getSnapshot failed', {
        operation: new AppEnvironmentAdapterError('getSnapshot').operation,
      });
      return UNKNOWN_SNAPSHOT;
    }
  }

  return {
    getSnapshot,
    describeForContext: () => {
      const snapshot = getSnapshot();
      const context: Record<string, string | number> = { os: snapshot.os };
      if (snapshot.osVersionMajor !== undefined) {
        context.osVersionMajor = snapshot.osVersionMajor;
      }
      if (snapshot.appVersion !== undefined) {
        context.appVersion = snapshot.appVersion;
      }
      if (snapshot.buildNumber !== undefined) {
        context.buildNumber = snapshot.buildNumber;
      }
      if (snapshot.buildChannel !== undefined) {
        context.buildChannel = snapshot.buildChannel;
      }
      if (snapshot.locale !== undefined) {
        context.locale = snapshot.locale;
      }
      if (snapshot.environment !== undefined) {
        context.environment = snapshot.environment;
      }
      return Object.freeze(context);
    },
  };
}
