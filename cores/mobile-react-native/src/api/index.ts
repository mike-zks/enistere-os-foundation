/**
 * API module — the OFFICIAL typed client (ADR-011 / ADR-016).
 *
 * RN 4 replaced the local transport "seam" with `@enistere/api-client-fetch`
 * (+ `@enistere/api-contracts`), the official Fetch client used across the
 * foundation. It is created once with the app's base URL + timeout and a
 * {@link MobileAuthSessionAdapter} that injects the in-memory access token
 * (ADR-015). No business endpoints.
 *
 * Refresh ownership (RN 4B): the AuthEngine owns the coalesced refresh + state
 * machine (ADR-004/011), so the client is created with `enableRefresh: false`
 * (a single refresh strategy). The reactive 401 path is restored via
 * {@link authedRequest} / {@link withAuthRetry}:
 *   401 → AuthEngine.refreshSession() (coalesced) → one retry → purge on failure.
 * Wrap authenticated calls in `authedRequest(() => apiClient.auth.getProfile())`.
 *
 * Multipart/upload helpers exist in the package but are NOT wired here.
 */
import { ApiClientError, createEnistereApiClient } from '@enistere/api-client-fetch';

import { mobileAuthSession } from '../auth/session-adapter';
import { appConfig } from '../config';
import { withAuthRetry } from './with-auth-retry';

/** App-wide official client. Authenticated requests get the in-memory Bearer token. */
export const apiClient = createEnistereApiClient({
  baseUrl: appConfig.apiBaseUrl,
  timeoutMs: appConfig.apiTimeoutMs,
  session: mobileAuthSession,
  enableRefresh: false,
});

/**
 * Runs an authenticated request through the official client with the 401 bridge
 * (RN 4B): on a 401 it refreshes via the AuthEngine's COALESCED refresh (bound
 * on the session adapter) and retries once; on refresh failure the session is
 * purged by the engine and the 401 surfaces. Use this for every authed call.
 */
export function authedRequest<T>(request: () => Promise<T>): Promise<T> {
  return withAuthRetry(mobileAuthSession.refreshSession, request);
}

/** Typed transport error surfaced by the official client (kind/status/errorCode). */
export { ApiClientError };
export { withAuthRetry, isUnauthorizedError } from './with-auth-retry';
export type { SessionRefresher } from './with-auth-retry';
export type { EnistereApiClient } from '@enistere/api-client-fetch';
