/**
 * Comportement du wrapper : Bearer, credentials, X-Request-Id, ApiClientError, réseau, timeout,
 * refresh single-flight, rejeu unique, aucun refresh sur 403, nettoyage de session, aucune fuite de
 * token, 204/404/503, login/logout.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ApiClientError,
  EnistereApiClient,
  InMemorySessionAdapter,
  type EnistereApiClientOptions,
} from '../src/index.js';
import {
  createMockFetch,
  errorBody,
  PROFILE,
  successEnvelope,
  tokens,
  type MockOutcome,
  type RecordedCall,
} from './helpers/mock-fetch.js';

const BASE_URL = 'https://api.test';

function make(
  handler: (call: RecordedCall, index: number) => MockOutcome | Promise<MockOutcome>,
  options: { session?: InMemorySessionAdapter; config?: Partial<EnistereApiClientOptions> } = {},
): { client: EnistereApiClient; session: InMemorySessionAdapter; calls: RecordedCall[] } {
  const session = options.session ?? new InMemorySessionAdapter({ accessToken: 'access-1', refreshToken: 'refresh-1' });
  const mock = createMockFetch(handler);
  const client = new EnistereApiClient({ baseUrl: BASE_URL, session, fetch: mock.fetch, ...options.config });
  return { client, session, calls: mock.calls };
}

test('baseUrl requise', () => {
  assert.throws(() => new EnistereApiClient({ baseUrl: '' } as EnistereApiClientOptions));
});

test('injecte le Bearer', async () => {
  const { client, calls } = make(() => ({ status: 200, body: successEnvelope(PROFILE) }));
  const profile = await client.auth.getProfile();
  assert.equal(profile.email, 'user@example.com');
  assert.equal(calls[0]?.authorization, 'Bearer access-1');
  assert.equal(calls[0]?.path, '/auth/me');
});

test('transmet credentials: include', async () => {
  const { client, calls } = make(() => ({ status: 200, body: successEnvelope(PROFILE) }), {
    config: { credentials: 'include' },
  });
  await client.auth.getProfile();
  assert.equal(calls[0]?.credentials, 'include');
});

test('pose X-Request-Id si createRequestId fourni', async () => {
  const { client, calls } = make(() => ({ status: 200, body: successEnvelope(PROFILE) }), {
    config: { createRequestId: () => 'req-123' },
  });
  await client.auth.getProfile();
  assert.equal(calls[0]?.requestId, 'req-123');
});

test('ApiClientError HTTP typée + requestId + helpers', async () => {
  const { client } = make(() => ({
    status: 404,
    body: errorBody(404, 'FILE_NOT_FOUND', 'srv-9'),
    headers: { 'x-request-id': 'srv-9' },
  }));
  await assert.rejects(
    () => client.files.getMetadata('00000000-0000-4000-8000-000000000000'),
    (e: unknown) => {
      assert.ok(e instanceof ApiClientError);
      assert.equal(e.kind, 'http');
      assert.equal(e.status, 404);
      assert.equal(e.errorCode, 'FILE_NOT_FOUND');
      assert.equal(e.requestId, 'srv-9');
      assert.ok(e.isNotFound);
      return true;
    },
  );
});

test('files.list appelle GET /files avec pagination et retourne une page publique typée', async () => {
  const { client, calls } = make(() => ({
    status: 200,
    body: successEnvelope({ items: [], limit: 10, offset: 20, nextOffset: null }),
  }));
  const page = await client.files.list({ limit: 10, offset: 20 });

  assert.deepEqual(page.items, []);
  assert.equal(page.limit, 10);
  assert.equal(page.offset, 20);
  assert.equal(page.nextOffset, null);
  assert.equal(calls[0]?.method, 'GET');
  assert.equal(calls[0]?.path, '/files');
  assert.ok(calls[0]?.url.includes('limit=10'));
  assert.ok(calls[0]?.url.includes('offset=20'));
});

test('erreur réseau (jamais une fausse 5xx)', async () => {
  const { client } = make(() => 'network-error');
  await assert.rejects(
    () => client.auth.getProfile(),
    (e: unknown) => e instanceof ApiClientError && e.kind === 'network' && e.status === null,
  );
});

test('timeout', async () => {
  const { client } = make(() => 'hang', { config: { timeoutMs: 25 } });
  await assert.rejects(() => client.auth.getProfile(), (e: unknown) => e instanceof ApiClientError && e.kind === 'timeout');
});

test('refresh sur 401 + rejeu unique avec nouveau token', async () => {
  let refreshed = false;
  const { client, session, calls } = make((call) => {
    if (call.path === '/auth/refresh') {
      refreshed = true;
      return { status: 200, body: successEnvelope(tokens(2)) };
    }
    return refreshed
      ? { status: 200, body: successEnvelope(PROFILE) }
      : { status: 401, body: errorBody(401, 'AUTH_UNAUTHORIZED') };
  });
  const profile = await client.auth.getProfile();
  assert.equal(profile.email, 'user@example.com');
  assert.equal(calls.filter((c) => c.path === '/auth/refresh').length, 1);
  const me = calls.filter((c) => c.path === '/auth/me');
  assert.equal(me.length, 2);
  assert.equal(me[1]?.authorization, 'Bearer access-2');
  assert.ok(session.updateCount >= 1);
});

test('single-flight : deux 401 concurrents → un seul refresh', async () => {
  let refreshCount = 0;
  let refreshed = false;
  const { client } = make(async (call) => {
    if (call.path === '/auth/refresh') {
      refreshCount += 1;
      await new Promise((r) => setTimeout(r, 10));
      refreshed = true;
      return { status: 200, body: successEnvelope(tokens(2)) };
    }
    return refreshed
      ? { status: 200, body: successEnvelope(PROFILE) }
      : { status: 401, body: errorBody(401, 'AUTH_UNAUTHORIZED') };
  });
  const [a, b] = await Promise.all([client.auth.getProfile(), client.auth.getProfile()]);
  assert.equal(a.email, 'user@example.com');
  assert.equal(b.email, 'user@example.com');
  assert.equal(refreshCount, 1);
});

test('rejeu UNIQUE : pas de boucle si toujours 401', async () => {
  let refreshCount = 0;
  const { client, calls } = make((call) => {
    if (call.path === '/auth/refresh') {
      refreshCount += 1;
      return { status: 200, body: successEnvelope(tokens(2)) };
    }
    return { status: 401, body: errorBody(401, 'AUTH_UNAUTHORIZED') };
  });
  await assert.rejects(() => client.auth.getProfile(), (e: unknown) => e instanceof ApiClientError && e.status === 401);
  assert.equal(refreshCount, 1);
  assert.equal(calls.filter((c) => c.path === '/auth/me').length, 2);
});

test('aucun refresh sur 403', async () => {
  const { client, calls } = make((call) => {
    if (call.path === '/auth/refresh') {
      return { status: 200, body: successEnvelope(tokens(2)) };
    }
    return { status: 403, body: errorBody(403, 'AUTH_FORBIDDEN') };
  });
  await assert.rejects(
    () => client.files.getMetadata('00000000-0000-4000-8000-000000000000'),
    (e: unknown) => e instanceof ApiClientError && e.status === 403 && e.isForbidden,
  );
  assert.equal(calls.filter((c) => c.path === '/auth/refresh').length, 0);
});

test('nettoie la session une fois si refresh échoue → session_expired', async () => {
  const { client, session } = make((call) =>
    call.path === '/auth/refresh'
      ? { status: 401, body: errorBody(401, 'AUTH_REFRESH_TOKEN_INVALID') }
      : { status: 401, body: errorBody(401, 'AUTH_UNAUTHORIZED') },
  );
  await assert.rejects(() => client.auth.getProfile(), (e: unknown) => e instanceof ApiClientError && e.kind === 'session_expired');
  assert.equal(session.clearCount, 1);
});

test('aucune fuite de token dans ApiClientError', async () => {
  const session = new InMemorySessionAdapter({ accessToken: 'SENTINEL_ACCESS', refreshToken: 'SENTINEL_REFRESH' });
  const { client, calls } = make(() => ({ status: 404, body: errorBody(404, 'FILE_NOT_FOUND', 'r-1') }), {
    session,
    config: { enableRefresh: false },
  });
  let captured: ApiClientError | null = null;
  try {
    await client.files.getMetadata('00000000-0000-4000-8000-000000000000');
  } catch (e) {
    captured = e as ApiClientError;
  }
  assert.ok(captured instanceof ApiClientError);
  assert.equal(calls[0]?.authorization, 'Bearer SENTINEL_ACCESS');
  const serialized = JSON.stringify({ ...captured, message: captured.message });
  for (const probe of [serialized, captured.message, String(captured.stack ?? '')]) {
    assert.ok(!probe.includes('SENTINEL_ACCESS'));
    assert.ok(!probe.includes('SENTINEL_REFRESH'));
  }
});

test('204 No Content : delete sans parse ; 404/503 typés', async () => {
  const ok = make(() => ({ status: 204 }));
  await ok.client.files.delete('00000000-0000-4000-8000-000000000000');
  assert.equal(ok.calls[0]?.method, 'DELETE');

  const nf = make(() => ({ status: 404, body: errorBody(404, 'FILE_NOT_FOUND') }));
  await assert.rejects(() => nf.client.files.delete('00000000-0000-4000-8000-000000000000'), (e: unknown) => e instanceof ApiClientError && e.status === 404);

  const un = make(() => ({ status: 503, body: errorBody(503, 'SERVICE_UNAVAILABLE') }));
  await assert.rejects(() => un.client.files.delete('00000000-0000-4000-8000-000000000000'), (e: unknown) => e instanceof ApiClientError && e.status === 503);
});

test('login stocke les tokens ; logout nettoie', async () => {
  const session = new InMemorySessionAdapter();
  const { client } = make(
    (call) =>
      call.path === '/auth/login'
        ? { status: 200, body: successEnvelope(tokens(1)) }
        : { status: 200, body: successEnvelope({ status: 'logged_out' }) },
    { session },
  );
  const result = await client.auth.login('user@example.com', 'password');
  assert.equal(result.tokenType, 'Bearer');
  assert.equal(await session.getAccessToken(), 'access-1');
  await client.auth.logout();
  assert.equal(await session.getAccessToken(), null);
});
