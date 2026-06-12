/**
 * Framework-agnostic permission service (RN 9 — native permissions).
 *
 * Orchestrates a {@link PermissionAdapter} behind a stable, testable API:
 * `getStatus` (live, never cached), `request` (prompt), `ensure` (get → prompt
 * only if grantable and not already granted), `openSettings`. The status is
 * always re-read from the OS — it is NEVER persisted (no SecureStore / Zustand /
 * TanStack Query, mission / ADR-015).
 *
 * Logging (ADR-040 / RN 8) : optional injected {@link Logger}; the service logs
 * ONLY safe, non-sensitive enum fields (`kind`, normalised `status`) through the
 * RN 8 logger — never raw adapter payloads, errors or anything sensitive, and it
 * never bypasses the central redaction. On an adapter failure it logs a `warn`
 * with `{ kind }` only and RE-THROWS (the caller decides), never swallowing into
 * a false `granted`.
 *
 * PURE / framework-agnostic (no React/RN import; the logger is injected) →
 * `node --test`-able.
 */
import type { Logger } from '../logger/logger';
import type { PermissionAdapter } from './adapter';
import {
  canRequestPermission,
  isPermissionGranted,
  normalizePermissionStatus,
  type PermissionKind,
  type PermissionStatus,
} from './status';

export interface PermissionService {
  /** Live OS status for `kind` (normalised). Never cached. */
  getStatus(kind: PermissionKind): Promise<PermissionStatus>;
  /** Prompt the OS for `kind` and return the resulting status. */
  request(kind: PermissionKind): Promise<PermissionStatus>;
  /** Return the status, prompting once only if grantable and not yet granted. */
  ensure(kind: PermissionKind): Promise<PermissionStatus>;
  /** Open the OS settings screen if the adapter supports it (else a no-op warn). */
  openSettings(): Promise<void>;
}

export interface PermissionServiceOptions {
  readonly adapter: PermissionAdapter;
  /** Optional RN 8 logger; the service logs only `{ kind, status }` safely. */
  readonly logger?: Logger;
}

/** Build a {@link PermissionService} over an adapter (+ optional safe logger). */
export function createPermissionService(options: PermissionServiceOptions): PermissionService {
  const { adapter, logger } = options;

  async function getStatus(kind: PermissionKind): Promise<PermissionStatus> {
    try {
      const status = normalizePermissionStatus(await adapter.getStatus(kind));
      logger?.debug('permission status resolved', { kind, status });
      return status;
    } catch {
      logger?.warn('permission status check failed', { kind });
      throw new PermissionAdapterError(kind, 'getStatus');
    }
  }

  async function request(kind: PermissionKind): Promise<PermissionStatus> {
    try {
      const status = normalizePermissionStatus(await adapter.request(kind));
      logger?.info('permission requested', { kind, status });
      return status;
    } catch {
      logger?.warn('permission request failed', { kind });
      throw new PermissionAdapterError(kind, 'request');
    }
  }

  async function ensure(kind: PermissionKind): Promise<PermissionStatus> {
    const current = await getStatus(kind);
    if (isPermissionGranted(current) || !canRequestPermission(current)) {
      return current;
    }
    return request(kind);
  }

  async function openSettings(): Promise<void> {
    if (!adapter.openSettings) {
      logger?.warn('permission openSettings unsupported');
      return;
    }
    try {
      await adapter.openSettings();
    } catch {
      logger?.warn('permission openSettings failed');
      throw new PermissionAdapterError(null, 'openSettings');
    }
  }

  return { getStatus, request, ensure, openSettings };
}

/**
 * Controlled error raised when an adapter operation fails. Carries only the safe
 * `kind` + `operation` (no underlying message → no sensitive leak via the cause).
 */
export class PermissionAdapterError extends Error {
  readonly kind: PermissionKind | null;
  readonly operation: 'getStatus' | 'request' | 'openSettings';

  constructor(kind: PermissionKind | null, operation: 'getStatus' | 'request' | 'openSettings') {
    super(`Permission adapter "${operation}" failed${kind ? ` for "${kind}"` : ''}.`);
    this.name = 'PermissionAdapterError';
    this.kind = kind;
    this.operation = operation;
  }
}
