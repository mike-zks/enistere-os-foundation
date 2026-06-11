/**
 * API module public surface — GENERIC TRANSPORT SEAM (no business endpoints).
 *
 * Governance:
 * - ADR-011: `fetch` is the official HTTP base (no Axios); tokens are supplied
 *   by the auth/session layer, never stored in the client.
 * - ADR-016: the OFFICIAL typed client is `@enistere/api-client-fetch`
 *   (+ `@enistere/api-contracts`) — already RN-safe and consumed by web-nextjs.
 *   Integrating it into the mobile core requires workspace + Metro monorepo
 *   wiring that touches the repo root, which is OUTSIDE this starter-foundation
 *   mission's authorized perimeter (and ADR-016 §7 defers client generation to a
 *   dedicated mission). Until then, this minimal generic transport is the SEAM:
 *   call sites use `apiClient.get/post/...`; when the official client lands, the
 *   token provider + base URL config carry over unchanged. We intentionally do
 *   NOT reimplement the package's refresh coordination / multipart / typed
 *   endpoints here (ADR-016 §39: never hand-write a contract interface).
 *
 * `apiClient` is a configured singleton (base URL + timeout from app config).
 * The access-token provider is wired by the auth layer at runtime via
 * `apiClient.setTokenProvider(...)` to avoid a circular dependency.
 *
 * Neutral example endpoints a consumer might call (NOT implemented here, given
 * as placeholders only): `GET /health`, `GET /me`.
 */
import { appConfig } from '../config';
import { ApiClient } from './client';

export { ApiClient } from './client';
export { ApiError, NetworkError, TimeoutError } from './errors';
export type {
  ApiClientConfig,
  HttpMethod,
  RequestOptions,
  TokenProvider,
} from './types';

export const apiClient = new ApiClient({
  baseUrl: appConfig.apiBaseUrl,
  timeoutMs: appConfig.apiTimeoutMs,
});
