/**
 * usePermission — minimal React hook over the permission service (RN 9).
 *
 * Exposes `{ status, loading, error }` plus `request`/`refresh`/`openSettings`
 * for a single {@link PermissionKind}, backed by a {@link PermissionAdapter}.
 * NO UI, NO picker, NO notification — just generic state. The status is read
 * live and held in component state only (never persisted, mission / ADR-015).
 *
 * React/ESM module → typecheck-only (not in the `node --test` build); the logic
 * it drives (`createPermissionService` + the pure model) IS unit-tested.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Logger } from '../logger';
import type { PermissionAdapter } from './adapter';
import { createPermissionService } from './engine';
import type { PermissionKind, PermissionStatus } from './status';

export interface UsePermissionOptions {
  /** Optional RN 8 logger (safe fields only). */
  readonly logger?: Logger;
  /** Skip the initial status read on mount (default `false`). */
  readonly skipInitialCheck?: boolean;
}

export interface UsePermissionResult {
  readonly status: PermissionStatus;
  readonly loading: boolean;
  readonly error: Error | null;
  /** Prompt the OS and update state with the resulting status. */
  readonly request: () => Promise<PermissionStatus>;
  /** Re-read the live OS status and update state. */
  readonly refresh: () => Promise<PermissionStatus>;
  /** Open the OS settings screen if supported by the adapter. */
  readonly openSettings: () => Promise<void>;
}

export function usePermission(
  kind: PermissionKind,
  adapter: PermissionAdapter,
  options?: UsePermissionOptions,
): UsePermissionResult {
  const logger = options?.logger;
  const skipInitialCheck = options?.skipInitialCheck ?? false;

  const service = useMemo(
    () => createPermissionService({ adapter, logger }),
    [adapter, logger],
  );

  const [status, setStatus] = useState<PermissionStatus>('unknown');
  const [loading, setLoading] = useState<boolean>(!skipInitialCheck);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  const run = useCallback(
    async (op: () => Promise<PermissionStatus>): Promise<PermissionStatus> => {
      if (mounted.current) {
        setLoading(true);
        setError(null);
      }
      try {
        const next = await op();
        if (mounted.current) {
          setStatus(next);
        }
        return next;
      } catch (caught) {
        if (mounted.current) {
          setError(caught instanceof Error ? caught : new Error('Permission operation failed'));
        }
        return 'unknown';
      } finally {
        if (mounted.current) {
          setLoading(false);
        }
      }
    },
    [],
  );

  const refresh = useCallback(() => run(() => service.getStatus(kind)), [run, service, kind]);
  const request = useCallback(() => run(() => service.request(kind)), [run, service, kind]);
  const openSettings = useCallback(() => service.openSettings(), [service]);

  useEffect(() => {
    mounted.current = true;
    if (!skipInitialCheck) {
      void refresh();
    }
    return () => {
      mounted.current = false;
    };
  }, [refresh, skipInitialCheck]);

  return { status, loading, error, request, refresh, openSettings };
}
