/**
 * 401 bridge (RN 4B) — restores the RN 1–3 `401 → refresh → retry` behaviour
 * over the official client. `node --test`, agnostic (no @enistere import).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isUnauthorizedError, withAuthRetry } from '../src/api/with-auth-retry';

/** A stand-in for `ApiClientError` — `isUnauthorized` is what the bridge reads. */
function unauthorized(): unknown {
  return Object.assign(new Error('Unauthorized'), { isUnauthorized: true });
}

test('isUnauthorizedError matches a 401-shaped error only', () => {
  assert.equal(isUnauthorizedError(unauthorized()), true);
  assert.equal(isUnauthorizedError(Object.assign(new Error(), { isUnauthorized: false })), false);
  assert.equal(isUnauthorizedError(new Error('network')), false);
  assert.equal(isUnauthorizedError(null), false);
  assert.equal(isUnauthorizedError('nope'), false);
});

test('success (no 401): returns the result, never refreshes', async () => {
  let refreshCalls = 0;
  let requestCalls = 0;
  const result = await withAuthRetry(
    async () => {
      refreshCalls += 1;
      return 'tok';
    },
    async () => {
      requestCalls += 1;
      return 'ok';
    },
  );
  assert.equal(result, 'ok');
  assert.equal(requestCalls, 1);
  assert.equal(refreshCalls, 0);
});

test('401 → refresh succeeds → single retry returns the result', async () => {
  let refreshCalls = 0;
  let requestCalls = 0;
  const result = await withAuthRetry(
    async () => {
      refreshCalls += 1;
      return 'new-token';
    },
    async () => {
      requestCalls += 1;
      if (requestCalls === 1) {
        throw unauthorized();
      }
      return 'ok-after-refresh';
    },
  );
  assert.equal(result, 'ok-after-refresh');
  assert.equal(requestCalls, 2); // original + one retry
  assert.equal(refreshCalls, 1);
});

test('401 → refresh returns null (session purged) → surfaces the 401, no retry', async () => {
  let refreshCalls = 0;
  let requestCalls = 0;
  const error = unauthorized();
  await assert.rejects(
    withAuthRetry(
      async () => {
        refreshCalls += 1;
        return null;
      },
      async () => {
        requestCalls += 1;
        throw error;
      },
    ),
    (thrown) => thrown === error,
  );
  assert.equal(requestCalls, 1); // never retried
  assert.equal(refreshCalls, 1);
});

test('retry still 401 → propagates, never refreshes twice (no loop)', async () => {
  let refreshCalls = 0;
  let requestCalls = 0;
  await assert.rejects(
    withAuthRetry(
      async () => {
        refreshCalls += 1;
        return 'new-token';
      },
      async () => {
        requestCalls += 1;
        throw unauthorized();
      },
    ),
    (thrown) => isUnauthorizedError(thrown),
  );
  assert.equal(requestCalls, 2); // original + one retry, then stop
  assert.equal(refreshCalls, 1); // refreshed exactly once
});

test('non-401 error → thrown immediately, never refreshes', async () => {
  let refreshCalls = 0;
  let requestCalls = 0;
  const error = new Error('network down');
  await assert.rejects(
    withAuthRetry(
      async () => {
        refreshCalls += 1;
        return 'tok';
      },
      async () => {
        requestCalls += 1;
        throw error;
      },
    ),
    (thrown) => thrown === error,
  );
  assert.equal(requestCalls, 1);
  assert.equal(refreshCalls, 0);
});
