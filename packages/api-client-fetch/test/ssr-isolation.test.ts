/**
 * Isolation SSR : deux clients (deux sessions) ne partagent AUCUN état d'authentification.
 * Reproduit le besoin Next.js « une instance par requête/utilisateur ».
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { EnistereApiClient, InMemorySessionAdapter } from '../src/index.js';
import { createMockFetch, PROFILE, successEnvelope } from './helpers/mock-fetch.js';

test('deux clients SSR isolent leurs sessions', async () => {
  const mock = createMockFetch(() => ({ status: 200, body: successEnvelope(PROFILE) }));

  const userA = new EnistereApiClient({
    baseUrl: 'https://api.test',
    fetch: mock.fetch,
    session: new InMemorySessionAdapter({ accessToken: 'token-A', refreshToken: 'r-A' }),
  });
  const userB = new EnistereApiClient({
    baseUrl: 'https://api.test',
    fetch: mock.fetch,
    session: new InMemorySessionAdapter(), // pas de token
  });

  await userA.auth.getProfile();
  await userB.auth.getProfile();

  assert.equal(mock.calls[0]?.authorization, 'Bearer token-A');
  // Le second client n'a hérité d'aucun token du premier.
  assert.equal(mock.calls[1]?.authorization, null);
});
