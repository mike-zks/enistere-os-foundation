import { ApiClientError } from '@enistere/api-client-fetch';

/**
 * Retry guard contributed through `expo.query-retry-guard`.
 *
 * A 401 needs a re-authentication, not another attempt: retrying it burns the
 * budget and delays the moment the user is told to sign in again. The 401
 * *recovery* belongs to the AuthEngine's coalesced refresh; TanStack Query only
 * has to stay out of its way.
 */
export const stopRetryOnUnauthorized = (error: unknown): boolean =>
  error instanceof ApiClientError && error.isUnauthorized;
