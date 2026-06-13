/**
 * Bounded retry policy (RN 24 — retry / backoff).
 *
 * A small, defensive descriptor for an exponential-backoff retry strategy, plus
 * a tolerant normaliser. GENERIC primitives only: NO network, NO global clock,
 * NO `Date.now()`, NO dependency (mission). Reusable by FUTURE network/offline
 * calls — it does NOT change the existing 401 bridge (RN 4B) nor the QueryClient
 * (RN 5).
 *
 * `maxAttempts` INCLUDES the initial call: `maxAttempts = 3` ⇒ 1 call + 2
 * retries; `maxAttempts <= 1` ⇒ no retry.
 *
 * PURE / framework-agnostic (no React/RN/ESM import) → unit-tested under
 * `node --test`.
 */

export interface RetryPolicy {
  /** Total attempts INCLUDING the initial call (≥ 1). */
  readonly maxAttempts: number;
  /** Base delay (ms) before the first retry. */
  readonly baseDelayMs: number;
  /** Hard cap (ms) on any single backoff delay. */
  readonly maxDelayMs: number;
  /** Exponential growth factor per retry (≥ 1). */
  readonly factor: number;
  /** Apply randomised jitter (only when an `rng` is provided to the backoff). */
  readonly jitter: boolean;
}

// --- Defensive bounds -----------------------------------------------------------
export const MAX_RETRY_ATTEMPTS = 10;
export const MAX_RETRY_DELAY_MS = 300_000; // 5 minutes
export const MAX_RETRY_FACTOR = 10;

/** Sensible generic defaults (used as fallback for any invalid field). */
export const DEFAULT_RETRY_POLICY: RetryPolicy = Object.freeze({
  maxAttempts: 3,
  baseDelayMs: 300,
  maxDelayMs: 30_000,
  factor: 2,
  jitter: true,
});

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(Math.max(Math.floor(value), min), max);
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(Math.max(value, min), max);
}

/**
 * Coerce an arbitrary input into a valid {@link RetryPolicy}, clamping every
 * field to its defensive bounds and falling back to {@link DEFAULT_RETRY_POLICY}
 * for anything invalid. Tolerates `undefined`/junk → defaults. Never throws.
 */
export function normalizeRetryPolicy(input?: unknown): RetryPolicy {
  const source =
    input !== null && typeof input === 'object' ? (input as Record<string, unknown>) : {};

  const maxDelayMs = clampNumber(source.maxDelayMs, 0, MAX_RETRY_DELAY_MS, DEFAULT_RETRY_POLICY.maxDelayMs);
  const baseDelayMs = clampNumber(source.baseDelayMs, 0, maxDelayMs, Math.min(DEFAULT_RETRY_POLICY.baseDelayMs, maxDelayMs));
  const factor = clampNumber(source.factor, 1, MAX_RETRY_FACTOR, DEFAULT_RETRY_POLICY.factor);
  const maxAttempts = clampInt(source.maxAttempts, 1, MAX_RETRY_ATTEMPTS, DEFAULT_RETRY_POLICY.maxAttempts);
  const jitter = typeof source.jitter === 'boolean' ? source.jitter : DEFAULT_RETRY_POLICY.jitter;

  return Object.freeze({ maxAttempts, baseDelayMs, maxDelayMs, factor, jitter });
}
