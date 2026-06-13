/**
 * Generic retry runner with injected timing (RN 24 — retry / backoff).
 *
 * Runs `fn` with bounded exponential backoff. It is **deterministic and
 * side-effect-injected**: `sleep` (and the jitter `rng`) are passed in, so there
 * is NO `Date.now()`/`setTimeout` in the tested path and NO real network. It
 * **never masks the failure**: when retries are exhausted or the error is not
 * retryable, the ORIGINAL final error is re-thrown unchanged.
 *
 * Governance (mission): NEVER retries 401/403/session-expired (auth territory,
 * owned by the AuthEngine / `withAuthRetry` RN 4B) — a hard block that no custom
 * `shouldRetry` can override. Does NOT refresh tokens/sessions, does NOT rebuild
 * multipart, does NOT touch the existing 401 bridge or the QueryClient.
 *
 * Logging (ADR-040 / RN 8): optional injected logger; logs ONLY
 * `{ attempt, delayMs }` — never the error message/body/url/token.
 *
 * PURE / framework-agnostic (no React/RN import; no `Date.now()` in the tested
 * path) → unit-tested under `node --test`.
 */
import type { Logger } from '../logger/logger';
import { computeBackoffDelay } from './backoff';
import { normalizeRetryPolicy, type RetryPolicy } from './policy';
import { isAuthOwnedError, isRetryableError } from './retryable-error';

export interface WithRetryOptions {
  /** Injected delay (ms) → resolves after the wait. No global timer is used. */
  readonly sleep: (ms: number) => Promise<void>;
  /** Injected random source for jitter (deterministic in tests). */
  readonly rng?: () => number;
  /**
   * Custom decision per attempt. May REDUCE retries (return `false`) or opt into
   * an otherwise non-retryable error — but it can NEVER force a 401/403/session
   * retry (hard-blocked). When omitted, {@link isRetryableError} is used.
   */
  readonly shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Optional RN 8 logger (`{ attempt, delayMs }` only). */
  readonly logger?: Logger;
}

/**
 * Execute `fn`, retrying on transient failures per `policy`. Returns `fn`'s
 * resolved value, or re-throws the original final error. `maxAttempts` includes
 * the initial call (`maxAttempts <= 1` ⇒ no retry).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  policy: RetryPolicy | Partial<RetryPolicy> | undefined,
  options: WithRetryOptions,
): Promise<T> {
  const p = normalizeRetryPolicy(policy);
  const { sleep, rng, shouldRetry, logger } = options;

  let attempt = 1;
  for (;;) {
    try {
      return await fn();
    } catch (error) {
      // Last attempt → propagate the ORIGINAL error, never masked.
      if (attempt >= p.maxAttempts) {
        throw error;
      }
      // Auth-owned errors are never retried, whatever `shouldRetry` says.
      if (isAuthOwnedError(error)) {
        throw error;
      }
      const retry = shouldRetry ? shouldRetry(error, attempt) === true : isRetryableError(error);
      if (!retry) {
        throw error;
      }
      const delayMs = computeBackoffDelay(attempt, p, rng);
      logger?.debug('retry scheduled', { attempt, delayMs });
      await sleep(delayMs);
      attempt += 1;
    }
  }
}
