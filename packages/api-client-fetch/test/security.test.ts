/**
 * Sécurité : des sentinelles fictives (famille `PACKAGE_*_SECRET`) ne doivent JAMAIS apparaître dans
 * une `ApiClientError`, quel que soit le mode d'échec (HTTP, réseau, timeout).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ApiClientError, EnistereApiClient, InMemorySessionAdapter } from '../src/index.js';
import { createMockFetch, errorBody, type MockOutcome } from './helpers/mock-fetch.js';

const SENTINELS = [
  'PACKAGE_ACCESS_TOKEN_SECRET',
  'PACKAGE_REFRESH_TOKEN_SECRET',
  'PACKAGE_PASSWORD_SECRET',
  'PACKAGE_SIGNED_URL_SECRET',
];

function assertNoSentinel(error: ApiClientError): void {
  const serialized = JSON.stringify({ ...error, message: error.message });
  for (const probe of [serialized, error.message, String(error.stack ?? '')]) {
    for (const s of SENTINELS) {
      assert.ok(!probe.includes(s), `sentinelle fuitée (${s})`);
    }
  }
}

function client(handler: () => MockOutcome, timeoutMs?: number) {
  const session = new InMemorySessionAdapter({
    accessToken: 'PACKAGE_ACCESS_TOKEN_SECRET',
    refreshToken: 'PACKAGE_REFRESH_TOKEN_SECRET',
  });
  const mock = createMockFetch(handler);
  return new EnistereApiClient({
    baseUrl: 'https://api.test',
    session,
    fetch: mock.fetch,
    enableRefresh: false,
    ...(timeoutMs ? { timeoutMs } : {}),
  });
}

test('erreur HTTP : aucune sentinelle', async () => {
  const c = client(() => ({ status: 401, body: errorBody(401, 'AUTH_UNAUTHORIZED', 'r-1') }));
  await assert.rejects(
    () => c.auth.login('user@example.com', 'PACKAGE_PASSWORD_SECRET'),
    (e: unknown) => {
      assert.ok(e instanceof ApiClientError);
      assertNoSentinel(e);
      return true;
    },
  );
});

test('erreur réseau : aucune sentinelle', async () => {
  const c = client(() => 'network-error');
  await assert.rejects(
    () => c.auth.getProfile(),
    (e: unknown) => {
      assert.ok(e instanceof ApiClientError);
      assertNoSentinel(e);
      return true;
    },
  );
});

test('timeout : aucune sentinelle', async () => {
  const c = client(() => 'hang', 20);
  await assert.rejects(
    () => c.auth.getProfile(),
    (e: unknown) => {
      assert.ok(e instanceof ApiClientError);
      assertNoSentinel(e);
      return true;
    },
  );
});
