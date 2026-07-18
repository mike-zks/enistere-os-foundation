/**
 * Retry policy + backoff (RN 24 — retry / backoff) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DEFAULT_RETRY_POLICY,
  MAX_RETRY_ATTEMPTS,
  MAX_RETRY_DELAY_MS,
  MAX_RETRY_FACTOR,
  normalizeRetryPolicy,
} from '../src/retry/policy';
import { computeBackoffDelay } from '../src/retry/backoff';

test('normalizeRetryPolicy clamps every field; junk → defaults', () => {
  for (const junk of [null, undefined, 42, 'x', []]) {
    assert.deepEqual({ ...normalizeRetryPolicy(junk) }, { ...DEFAULT_RETRY_POLICY });
  }
  const clamped = normalizeRetryPolicy({
    maxAttempts: 9999,
    baseDelayMs: -50,
    maxDelayMs: 9_999_999,
    factor: 99,
    jitter: 'nope',
  });
  assert.equal(clamped.maxAttempts, MAX_RETRY_ATTEMPTS);
  assert.equal(clamped.baseDelayMs, 0);
  assert.equal(clamped.maxDelayMs, MAX_RETRY_DELAY_MS);
  assert.equal(clamped.factor, MAX_RETRY_FACTOR);
  assert.equal(clamped.jitter, DEFAULT_RETRY_POLICY.jitter); // non-boolean → default
  // baseDelayMs is never above maxDelayMs
  const tight = normalizeRetryPolicy({ baseDelayMs: 5000, maxDelayMs: 1000 });
  assert.ok(tight.baseDelayMs <= tight.maxDelayMs);
  // maxAttempts floored to an integer ≥ 1
  assert.equal(normalizeRetryPolicy({ maxAttempts: 2.9 }).maxAttempts, 2);
  assert.equal(normalizeRetryPolicy({ maxAttempts: 0 }).maxAttempts, 1);
});

test('computeBackoffDelay is exponential and capped (no jitter)', () => {
  const policy = normalizeRetryPolicy({ baseDelayMs: 100, factor: 2, maxDelayMs: 1000, jitter: false });
  assert.equal(computeBackoffDelay(1, policy), 100); // base
  assert.equal(computeBackoffDelay(2, policy), 200);
  assert.equal(computeBackoffDelay(3, policy), 400);
  assert.equal(computeBackoffDelay(4, policy), 800);
  assert.equal(computeBackoffDelay(5, policy), 1000); // capped (1600 → 1000)
  assert.equal(computeBackoffDelay(50, policy), 1000); // huge exponent stays capped
  // attempt < 1 → 0
  assert.equal(computeBackoffDelay(0, policy), 0);
  assert.equal(computeBackoffDelay(-3, policy), 0);
});

test('jitter is deterministic via the injected rng (never Math.random)', () => {
  const policy = normalizeRetryPolicy({ baseDelayMs: 100, factor: 2, maxDelayMs: 10_000, jitter: true });
  // rng = 0.5 → half of the capped delay
  assert.equal(computeBackoffDelay(1, policy, () => 0.5), 50);
  assert.equal(computeBackoffDelay(2, policy, () => 0.5), 100);
  assert.equal(computeBackoffDelay(3, policy, () => 0.25), 100); // 0.25 * 400
  // rng out of range is clamped to [0,1]
  assert.equal(computeBackoffDelay(1, policy, () => 5), 100); // clamp → 1
  assert.equal(computeBackoffDelay(1, policy, () => -1), 0); // clamp → 0
  // jitter enabled but no rng → no randomness (returns capped)
  assert.equal(computeBackoffDelay(2, policy), 200);
});
