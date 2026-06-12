/**
 * 401 bridge between the official `@enistere/api-client-fetch` client and the
 * AuthEngine (RN 4B — restores the RN 1–3 behaviour over the official client).
 *
 * The official client is created with `enableRefresh: false`, so it performs NO
 * refresh of its own — there is a SINGLE refresh strategy, owned by the
 * AuthEngine. This helper is that strategy's reactive entry point:
 *
 *   401 → AuthEngine.refreshSession() (COALESCED) → ONE retry → purge on failure
 *
 * On a 401 it asks the engine to refresh (concurrent callers share the engine's
 * one in-flight refresh), then retries the request EXACTLY ONCE — the retried
 * request re-reads the refreshed in-memory access token via the session adapter,
 * so it carries the new Bearer. If the refresh fails (the engine returns `null`
 * and has already purged the session → `expired`), the original 401 is surfaced.
 * Never loops: a second 401 is propagated, not refreshed again.
 *
 * Pure + framework-agnostic: the 401 is detected structurally (`isUnauthorized`,
 * the getter exposed by `ApiClientError`) with NO `@enistere/*` import, so this
 * module compiles and runs under `node --test`.
 */

/** Yields a fresh access token, or `null` when the session can't be recovered. */
export type SessionRefresher = () => Promise<string | null>;

/**
 * True for an official-client error that represents HTTP 401. Matches
 * `ApiClientError` (whose `isUnauthorized` getter is `status === 401`)
 * structurally, without importing the ESM package.
 */
export function isUnauthorizedError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { isUnauthorized?: unknown }).isUnauthorized === true
  );
}

/**
 * Runs an authenticated `request`; on a 401, refreshes via `refresh` and retries
 * once. See the module header for the full contract.
 */
export async function withAuthRetry<T>(
  refresh: SessionRefresher,
  request: () => Promise<T>,
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (!isUnauthorizedError(error)) {
      throw error;
    }
    const token = await refresh();
    if (token === null) {
      // Refresh failed → the engine has purged the session → surface the 401.
      throw error;
    }
    // Single retry with the refreshed Bearer. A further 401 is NOT retried.
    return request();
  }
}
