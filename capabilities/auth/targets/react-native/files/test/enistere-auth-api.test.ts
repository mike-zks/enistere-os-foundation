import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { EnistereApiClient } from '@enistere/api-client-fetch';

import { AuthApiError } from '../src/auth/auth-api';
import { EnistereAuthApi } from '../src/auth/enistere-auth-api';

type PostResult = {
  data?: {
    data: {
      accessToken: string;
      refreshToken: string;
      accessTokenExpiresIn: number;
    };
  };
  error?: unknown;
};

function clientWith(post: (path: string, options: unknown) => Promise<PostResult>): EnistereApiClient {
  return {
    raw: { POST: post },
  } as unknown as EnistereApiClient;
}

test('login maps the canonical session without exposing transport details', async () => {
  const api = new EnistereAuthApi(clientWith(async () => ({
    data: {
      data: {
        accessToken: 'access-value',
        refreshToken: 'refresh-value',
        accessTokenExpiresIn: 60,
      },
    },
  })), () => 1_000);

  const session = await api.login({ email: 'user@example.test', password: 'secret-value' });
  assert.equal(session.accessToken, 'access-value');
  assert.equal(session.refreshToken, 'refresh-value');
  assert.equal(session.expiresAt, 61_000);
});

test('logout sends the refresh token to the authority revocation endpoint', async () => {
  const calls: Array<{ path: string; options: unknown }> = [];
  const api = new EnistereAuthApi(clientWith(async (path, options) => {
    calls.push({ path, options });
    return { data: undefined };
  }));

  await api.logout('refresh-to-revoke');
  assert.deepEqual(calls, [{
    path: '/auth/logout',
    options: { body: { refreshToken: 'refresh-to-revoke' } },
  }]);
});

test('transport failures use a generic error that does not leak credentials or tokens', async () => {
  const secret = 'refresh-secret-must-not-leak';
  const api = new EnistereAuthApi(clientWith(async () => ({
    error: { message: secret, status: 503 },
  })));

  await assert.rejects(
    () => api.logout(secret),
    (error: unknown) => error instanceof AuthApiError
      && error.message === 'Logout failed.'
      && !error.message.includes(secret),
  );
});
