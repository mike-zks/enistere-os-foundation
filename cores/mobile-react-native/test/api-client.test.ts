import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ApiClient } from '../src/api/client';
import { ApiError, NetworkError, TimeoutError } from '../src/api/errors';

type FetchInit = {
  method?: string;
  headers: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
};
type FetchStub = (url: string, init: FetchInit) => Promise<Response>;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function withFetch(stub: FetchStub, fn: () => Promise<void>): Promise<void> {
  const prev = globalThis.fetch;
  globalThis.fetch = stub as unknown as typeof fetch;
  try {
    await fn();
  } finally {
    globalThis.fetch = prev;
  }
}

function makeClient(): ApiClient {
  return new ApiClient({ baseUrl: 'http://api.test', timeoutMs: 1_000 });
}

test('injects Authorization header from the token provider', async () => {
  const client = makeClient();
  client.setTokenProvider(() => 'tok');
  let seenAuth: string | undefined;
  await withFetch(
    async (_url, init) => {
      seenAuth = init.headers.Authorization;
      return jsonResponse({ ok: true });
    },
    async () => {
      assert.deepEqual(await client.get<{ ok: boolean }>('/health'), { ok: true });
    },
  );
  assert.equal(seenAuth, 'Bearer tok');
});

test('throws ApiError on a non-2xx response', async () => {
  const client = makeClient();
  await withFetch(
    async () => jsonResponse({ message: 'boom' }, 500),
    async () => {
      await assert.rejects(
        () => client.get('/x'),
        (e: unknown) => e instanceof ApiError && e.status === 500,
      );
    },
  );
});

test('401 triggers a refresh and one retry with the new token', async () => {
  const client = makeClient();
  let token = 'old';
  client.setTokenProvider(() => token);
  client.setUnauthorizedHandler(async () => {
    token = 'new';
    return 'new';
  });
  let calls = 0;
  let secondAuth: string | undefined;
  await withFetch(
    async (_url, init) => {
      calls += 1;
      if (calls === 1) {
        return jsonResponse({ message: 'unauthorized' }, 401);
      }
      secondAuth = init.headers.Authorization;
      return jsonResponse({ ok: true });
    },
    async () => {
      assert.deepEqual(await client.get<{ ok: boolean }>('/x'), { ok: true });
    },
  );
  assert.equal(calls, 2);
  assert.equal(secondAuth, 'Bearer new');
});

test('401 with an unrecoverable session surfaces ApiError(401), no retry', async () => {
  const client = makeClient();
  client.setTokenProvider(() => 'old');
  client.setUnauthorizedHandler(async () => null);
  let calls = 0;
  await withFetch(
    async () => {
      calls += 1;
      return jsonResponse({ message: 'unauthorized' }, 401);
    },
    async () => {
      await assert.rejects(
        () => client.get('/x'),
        (e: unknown) => e instanceof ApiError && e.status === 401,
      );
    },
  );
  assert.equal(calls, 1);
});

test('an aborted fetch maps to TimeoutError', async () => {
  const client = makeClient();
  await withFetch(
    async () => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      throw err;
    },
    async () => {
      await assert.rejects(() => client.get('/x'), (e: unknown) => e instanceof TimeoutError);
    },
  );
});

test('a failed fetch maps to NetworkError', async () => {
  const client = makeClient();
  await withFetch(
    async () => {
      throw new Error('socket hang up');
    },
    async () => {
      await assert.rejects(() => client.get('/x'), (e: unknown) => e instanceof NetworkError);
    },
  );
});
