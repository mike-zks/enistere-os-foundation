/**
 * Structural retryability classifier (RN 24 — retry / backoff).
 *
 * Decides whether an error MAY be retried — STRUCTURALLY (duck-typing the public
 * `status`/`kind`/`isUnauthorized`/`isForbidden` fields), with NO `@enistere/*`
 * ESM import, so it stays pure and `node --test`-able and aligns with
 * `ApiClientError`/`QueryError` (RN 5).
 *
 * Retryable: network, timeout, HTTP 408, 429, 5xx (transient).
 * NOT retryable: 400, 401, 403, 404, 409, validation, invalid response, session
 * expired, and anything unrecognised (conservative — never retry a bug). In
 * particular **401/403/session-expired are NEVER retryable here**: the 401
 * refresh strategy is owned by the AuthEngine / `withAuthRetry` (RN 4B), never by
 * this generic helper.
 *
 * PURE / framework-agnostic (no React/RN/ESM import; no `Date.now()`) → unit-tested
 * under `node --test`.
 */

/** Safe, bounded reason for a retry decision (enum — never error content). */
export type RetryReason =
  | 'status-5xx'
  | 'status-408'
  | 'status-429'
  | 'status-4xx'
  | 'network'
  | 'timeout'
  | 'session-expired'
  | 'unknown';

export interface RetryDecision {
  readonly retryable: boolean;
  /** A safe enum (never the error message/body/url/token). */
  readonly reason: RetryReason;
}

const RETRYABLE_ERROR_NAMES: ReadonlySet<string> = new Set(['AbortError', 'TimeoutError']);
const RETRYABLE_ERROR_CODES: ReadonlySet<string> = new Set([
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EPIPE',
]);
const TIMEOUT_PATTERN = /\btimed?\s?out\b|\btimeout\b/i;
const NETWORK_PATTERN = /network (request )?(failed|error)|fetch failed|connection (reset|refused)/i;

function readStatus(value: Record<string, unknown>): number | null {
  return typeof value.status === 'number' && Number.isFinite(value.status) ? value.status : null;
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Classify an error into a {@link RetryDecision}. Never throws; an unrecognised
 * value is NOT retryable.
 */
export function getRetryDecision(error: unknown): RetryDecision {
  if (typeof error !== 'object' || error === null) {
    return { retryable: false, reason: 'unknown' };
  }
  const value = error as Record<string, unknown>;

  // Auth territory — NEVER retried here (owned by the AuthEngine / withAuthRetry).
  if (value.kind === 'session_expired' || value.isUnauthorized === true) {
    return { retryable: false, reason: value.kind === 'session_expired' ? 'session-expired' : 'status-4xx' };
  }

  const status = readStatus(value);
  if (status !== null) {
    if (status === 408) {
      return { retryable: true, reason: 'status-408' };
    }
    if (status === 429) {
      return { retryable: true, reason: 'status-429' };
    }
    if (status >= 500 && status <= 599) {
      return { retryable: true, reason: 'status-5xx' };
    }
    // Every other status (incl. 400/401/403/404/409/413/415/422) → not retryable.
    return { retryable: false, reason: 'status-4xx' };
  }

  // No status: rely on the normalised `kind`, then on shape (name/code/message).
  if (value.kind === 'network') {
    return { retryable: true, reason: 'network' };
  }
  if (value.kind === 'timeout') {
    return { retryable: true, reason: 'timeout' };
  }
  const name = readString(value.name);
  const code = readString(value.code);
  const message = readString(value.message);
  if (name === 'TimeoutError' || TIMEOUT_PATTERN.test(message)) {
    return { retryable: true, reason: 'timeout' };
  }
  if (RETRYABLE_ERROR_NAMES.has(name) || RETRYABLE_ERROR_CODES.has(code) || NETWORK_PATTERN.test(message)) {
    return { retryable: true, reason: 'network' };
  }
  // Unrecognised (incl. `invalid_response`) → conservative: do not retry.
  return { retryable: false, reason: 'unknown' };
}

/** True when the error MAY be retried (transient). See {@link getRetryDecision}. */
export function isRetryableError(error: unknown): boolean {
  return getRetryDecision(error).retryable;
}

/**
 * True for an error that must NEVER be retried by this generic helper regardless
 * of any custom `shouldRetry` — the auth-owned cases (401/403/session expired).
 */
export function isAuthOwnedError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const value = error as Record<string, unknown>;
  return (
    value.status === 401 ||
    value.status === 403 ||
    value.isUnauthorized === true ||
    value.isForbidden === true ||
    value.kind === 'session_expired'
  );
}
