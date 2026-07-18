/**
 * Generic retry / backoff primitives (RN 24).
 *
 * Pure, deterministic helpers for transient-failure handling on FUTURE network/
 * offline calls: a bounded {@link RetryPolicy} + normaliser, an exponential
 * backoff with injected-rng jitter ({@link computeBackoffDelay}), a structural
 * retryability classifier ({@link isRetryableError}/{@link getRetryDecision}),
 * and a side-effect-injected runner ({@link withRetry}, with injected `sleep`).
 *
 * GENERIC only — NO network, NO global clock/`Date.now()` in the tested path, NO
 * dependency. NEVER retries 401/403/session-expired (auth territory, owned by the
 * AuthEngine / `withAuthRetry` RN 4B), NEVER refreshes tokens, NEVER masks the
 * final error, and does NOT change the existing 401 bridge or the QueryClient.
 * See ARCHITECTURE §33.
 */
export {
  DEFAULT_RETRY_POLICY,
  MAX_RETRY_ATTEMPTS,
  MAX_RETRY_DELAY_MS,
  MAX_RETRY_FACTOR,
  normalizeRetryPolicy,
} from './policy';
export type { RetryPolicy } from './policy';

export { computeBackoffDelay } from './backoff';

export { getRetryDecision, isRetryableError, isAuthOwnedError } from './retryable-error';
export type { RetryDecision, RetryReason } from './retryable-error';

export { withRetry } from './with-retry';
export type { WithRetryOptions } from './with-retry';
