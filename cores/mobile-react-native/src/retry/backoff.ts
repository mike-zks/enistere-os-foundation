/**
 * Exponential backoff with deterministic jitter (RN 24 — retry / backoff).
 *
 * Computes the delay (ms) BEFORE a given retry from a {@link RetryPolicy}. The
 * curve is exponential (`baseDelayMs · factor^(attempt-1)`), hard-capped at
 * `maxDelayMs`. Jitter is applied ONLY when the policy enables it AND a random
 * source `rng` is INJECTED — there is NO global clock and NO `Math.random()` in
 * this module, so the result is fully deterministic for a given `rng` sequence.
 *
 * `attempt` is the 1-based retry number: `1` = delay before the FIRST retry
 * (i.e. before the 2nd call). `attempt < 1` → `0`.
 *
 * PURE / framework-agnostic (no React/RN/ESM import; no `Date.now()`) → unit-tested
 * under `node --test`.
 */
import { normalizeRetryPolicy, type RetryPolicy } from './policy';

/** Clamp an injected rng() value into the `[0, 1]` range (tolerant). */
function boundedRandom(rng: () => number): number {
  const value = rng();
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.min(Math.max(value, 0), 1);
}

/**
 * The backoff delay (ms, integer ≥ 0) before retry number `attempt`. Defensive:
 * normalises the policy, caps the exponential at `maxDelayMs`, and applies
 * deterministic full-jitter (`rng() · cappedDelay`) only when `policy.jitter`
 * AND `rng` are present. Never throws.
 */
export function computeBackoffDelay(
  attempt: number,
  policy: RetryPolicy,
  rng?: () => number,
): number {
  if (typeof attempt !== 'number' || !Number.isFinite(attempt) || attempt < 1) {
    return 0;
  }
  const p = normalizeRetryPolicy(policy);
  const exponential = p.baseDelayMs * Math.pow(p.factor, Math.floor(attempt) - 1);
  // `Math.min` folds an `Infinity` exponential down to the cap.
  const capped = Math.min(exponential, p.maxDelayMs);
  const delay = p.jitter && rng ? boundedRandom(rng) * capped : capped;
  return Math.round(Math.max(0, delay));
}
