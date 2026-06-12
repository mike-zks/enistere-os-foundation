/**
 * API module — the OFFICIAL typed client (ADR-011 / ADR-016).
 *
 * RN 4 replaces the local transport "seam" with `@enistere/api-client-fetch`
 * (+ `@enistere/api-contracts`), the official Fetch client used across the
 * foundation (already RN-safe and consumed by web-nextjs). It is created once
 * with the app's base URL + timeout and a {@link MobileAuthSessionAdapter} that
 * injects the in-memory access token (ADR-015). No business endpoints.
 *
 * Refresh ownership: the AuthEngine owns the coalesced refresh + state machine
 * (ADR-004/011), so the client is created with `enableRefresh: false` and the
 * engine performs `/auth/refresh` via {@link EnistereAuthApi}. See ARCHITECTURE.
 *
 * Multipart/upload helpers (`buildUploadFormData`, RN `{uri,name,type}`) exist in
 * the package but are intentionally NOT wired here (no upload in this mission).
 */
import { ApiClientError, createEnistereApiClient } from '@enistere/api-client-fetch';

import { mobileAuthSession } from '../auth/session-adapter';
import { appConfig } from '../config';

/** App-wide official client. Authenticated requests get the in-memory Bearer token. */
export const apiClient = createEnistereApiClient({
  baseUrl: appConfig.apiBaseUrl,
  timeoutMs: appConfig.apiTimeoutMs,
  session: mobileAuthSession,
  enableRefresh: false,
});

/** Typed transport error surfaced by the official client (kind/status/errorCode). */
export { ApiClientError };
export type { EnistereApiClient } from '@enistere/api-client-fetch';
