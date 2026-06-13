/**
 * Generic retry runner (RN 24 — retry / backoff) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createLogger, type LogRecord } from '../src/logger/logger';
import { withRetry } from '../src/retry/with-retry';

/** A `sleep` that records every requested delay instead of waiting. */
function recordingSleep() {
  const delays: number[] = [];
  const sleep = (ms: number) => {
    delays.push(ms);
    return Promise.resolve();
  };
  return { sleep, delays };
}

const NO_JITTER = { maxAttempts: 4, baseDelayMs: 100, factor: 2, maxDelayMs: 100_000, jitter: false };

test('success on the first try → no retry, no sleep', async () => {
  const { sleep, delays } = recordingSleep();
  let calls = 0;
  const result = await withRetry(
    () => {
      calls += 1;
      return Promise.resolve('ok');
    },
    NO_JITTER,
    { sleep },
  );
  assert.equal(result, 'ok');
  assert.equal(calls, 1);
  assert.deepEqual(delays, []);
});

test('success after a transient failure → retried once', async () => {
  const { sleep, delays } = recordingSleep();
  let calls = 0;
  const result = await withRetry(
    () => {
      calls += 1;
      if (calls === 1) {
        return Promise.reject({ status: 503 });
      }
      return Promise.resolve('recovered');
    },
    NO_JITTER,
    { sleep },
  );
  assert.equal(result, 'recovered');
  assert.equal(calls, 2);
  assert.deepEqual(delays, [100]);
});

test('maxAttempts is respected and sleep gets the exact backoff delays', async () => {
  const { sleep, delays } = recordingSleep();
  let calls = 0;
  await assert.rejects(
    withRetry(
      () => {
        calls += 1;
        return Promise.reject({ status: 503 });
      },
      NO_JITTER,
      { sleep },
    ),
  );
  assert.equal(calls, 4); // maxAttempts includes the initial call
  assert.deepEqual(delays, [100, 200, 400]); // 3 retries
});

test('the FINAL error is the original last error, never masked/wrapped', async () => {
  const { sleep } = recordingSleep();
  const errors = [{ status: 503, tag: 'a' }, { status: 503, tag: 'b' }, { status: 503, tag: 'c' }, { status: 503, tag: 'final' }];
  let calls = 0;
  await assert.rejects(
    withRetry(
      () => {
        const e = errors[calls];
        calls += 1;
        return Promise.reject(e);
      },
      NO_JITTER,
      { sleep },
    ),
    (thrown: { tag?: string }) => thrown.tag === 'final',
  );
});

test('401/403/session-expired are NEVER retried (hard block, even via shouldRetry)', async () => {
  for (const error of [{ status: 401 }, { status: 403 }, { kind: 'session_expired' }, { isUnauthorized: true }]) {
    const { sleep, delays } = recordingSleep();
    let calls = 0;
    await assert.rejects(
      withRetry(
        () => {
          calls += 1;
          return Promise.reject(error);
        },
        NO_JITTER,
        { sleep, shouldRetry: () => true }, // tries to force a retry — must be ignored
      ),
    );
    assert.equal(calls, 1, JSON.stringify(error));
    assert.deepEqual(delays, []);
  }
});

test('business 4xx is not retried by default', async () => {
  const { sleep, delays } = recordingSleep();
  let calls = 0;
  await assert.rejects(
    withRetry(() => {
      calls += 1;
      return Promise.reject({ status: 409 });
    }, NO_JITTER, { sleep }),
  );
  assert.equal(calls, 1);
  assert.deepEqual(delays, []);
});

test('maxAttempts <= 1 → no retry', async () => {
  const { sleep, delays } = recordingSleep();
  let calls = 0;
  await assert.rejects(
    withRetry(() => {
      calls += 1;
      return Promise.reject({ status: 503 });
    }, { maxAttempts: 1, jitter: false }, { sleep }),
  );
  assert.equal(calls, 1);
  assert.deepEqual(delays, []);
});

test('custom shouldRetry can REDUCE retries (stop early)', async () => {
  const { sleep, delays } = recordingSleep();
  let calls = 0;
  await assert.rejects(
    withRetry(
      () => {
        calls += 1;
        return Promise.reject({ status: 503 });
      },
      NO_JITTER,
      { sleep, shouldRetry: (_error, attempt) => attempt < 2 }, // allow only the 1st retry
    ),
  );
  assert.equal(calls, 2); // initial + 1 retry, then shouldRetry says stop
  assert.deepEqual(delays, [100]);
});

test('the logger only ever sees { attempt, delayMs } — never the error', async () => {
  const records: LogRecord[] = [];
  const logger = createLogger({ level: 'debug', sink: (r) => records.push(r), clock: () => 1 });
  const { sleep } = recordingSleep();
  let calls = 0;
  await assert.rejects(
    withRetry(
      () => {
        calls += 1;
        return Promise.reject({ status: 503, message: 'secret token=abc', url: 'https://x/y?token=z' });
      },
      { maxAttempts: 3, baseDelayMs: 50, factor: 2, maxDelayMs: 1000, jitter: false },
      { sleep, logger },
    ),
  );
  const serialised = JSON.stringify(records);
  assert.ok(!serialised.includes('secret'));
  assert.ok(!serialised.includes('token=z'));
  const allowed = new Set(['attempt', 'delayMs']);
  for (const record of records) {
    for (const key of Object.keys(record.fields ?? {})) {
      assert.ok(allowed.has(key), `unexpected logged field: ${key}`);
    }
  }
});
