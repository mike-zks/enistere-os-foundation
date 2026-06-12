/**
 * Cache invalidation & purge helpers (RN 5 — server-state data layer).
 *
 * Thin, intention-revealing wrappers over a TanStack `QueryClient`:
 * - {@link invalidateScope} / {@link removeScope} — scoped invalidation using a
 *   query key from {@link createQueryKeys} (a partial key matches its whole
 *   sub-tree, ADR-012).
 * - {@link purgeServerState} — full purge for LOGOUT.
 *
 * SECURITY (ADR-015 §18): on logout/expiry the auth layer MUST call
 * {@link purgeServerState} so NO authenticated/cached data of the previous user
 * survives. The cache never holds tokens or signed URLs (those stay out of query
 * keys and out of cached payloads), but cached responses are user-scoped and
 * must not leak across sessions. Persisting the cache is intentionally NOT
 * supported (no offline cache persistence).
 */
import type { QueryClient, QueryKey } from '@tanstack/react-query';

/** Marks every query under `queryKey` stale (and refetches the active ones). */
export function invalidateScope(queryClient: QueryClient, queryKey: QueryKey): Promise<void> {
  return queryClient.invalidateQueries({ queryKey });
}

/** Drops every query under `queryKey` from the cache (no refetch). */
export function removeScope(queryClient: QueryClient, queryKey: QueryKey): void {
  queryClient.removeQueries({ queryKey });
}

/**
 * Purges ALL server state — call this on LOGOUT / session expiry. Cancels
 * in-flight fetches, then clears the entire query+mutation cache so the next
 * user starts clean (ADR-015 §18). The auth layer owns the trigger.
 */
export function purgeServerState(queryClient: QueryClient): void {
  void queryClient.cancelQueries();
  queryClient.clear();
}
