/**
 * Structural retryability classifier (RN 24 — retry / backoff) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getRetryDecision, isAuthOwnedError, isRetryableError } from '../src/retry/retryable-error';

test('transient errors ARE retryable (network/timeout/408/429/5xx)', () => {
  assert.equal(isRetryableError({ kind: 'network' }), true);
  assert.equal(isRetryableError({ kind: 'timeout' }), true);
  assert.equal(isRetryableError({ status: 408 }), true);
  assert.equal(isRetryableError({ status: 429 }), true);
  assert.equal(isRetryableError({ status: 500 }), true);
  assert.equal(isRetryableError({ status: 503 }), true);
  assert.equal(isRetryableError({ status: 599 }), true);
  // shape-based (no status/kind)
  assert.equal(isRetryableError({ name: 'AbortError' }), true);
  assert.equal(isRetryableError({ code: 'ETIMEDOUT' }), true);
  assert.equal(isRetryableError({ message: 'Network request failed' }), true);
  assert.equal(isRetryableError({ message: 'The operation timed out' }), true);
});

test('business 4xx and auth errors are NOT retryable (401/403 never)', () => {
  for (const status of [400, 401, 403, 404, 409, 413, 415, 422]) {
    assert.equal(isRetryableError({ status }), false, `status ${status}`);
  }
  assert.equal(isRetryableError({ kind: 'session_expired' }), false);
  assert.equal(isRetryableError({ isUnauthorized: true }), false);
  assert.equal(isRetryableError({ kind: 'invalid_response' }), false);
  // unrecognised / non-object → conservative not retryable
  for (const junk of [null, undefined, 42, 'x', {}, new Error('boom')]) {
    assert.equal(isRetryableError(junk), false, String(junk));
  }
});

test('getRetryDecision returns a SAFE enum reason (never error content)', () => {
  assert.deepEqual(getRetryDecision({ status: 503 }), { retryable: true, reason: 'status-5xx' });
  assert.deepEqual(getRetryDecision({ status: 408 }), { retryable: true, reason: 'status-408' });
  assert.deepEqual(getRetryDecision({ status: 429 }), { retryable: true, reason: 'status-429' });
  assert.deepEqual(getRetryDecision({ status: 404 }), { retryable: false, reason: 'status-4xx' });
  assert.deepEqual(getRetryDecision({ kind: 'network' }), { retryable: true, reason: 'network' });
  assert.deepEqual(getRetryDecision({ kind: 'session_expired' }), {
    retryable: false,
    reason: 'session-expired',
  });
  // the reason never leaks a message even when one is present
  const decision = getRetryDecision({ status: 500, message: 'secret token=abc' });
  assert.ok(!JSON.stringify(decision).includes('secret'));
});

test('isAuthOwnedError flags the auth-territory cases', () => {
  for (const e of [{ status: 401 }, { status: 403 }, { isUnauthorized: true }, { isForbidden: true }, { kind: 'session_expired' }]) {
    assert.equal(isAuthOwnedError(e), true, JSON.stringify(e));
  }
  for (const e of [{ status: 500 }, { status: 404 }, null, 'x']) {
    assert.equal(isAuthOwnedError(e), false, String(JSON.stringify(e)));
  }
});
