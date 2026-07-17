import assert from 'node:assert/strict';

import {
  createEnistereApiClient,
  InMemorySessionAdapter,
} from '../../packages/api-client-fetch/dist/index.js';

const ISO_NOW = '2026-07-17T00:00:00.000Z';
const USER_ID = '11111111-1111-4111-8111-111111111111';
const ACCESS_TOKEN = 'example-access-token';

const calls = [];

function jsonResponse(status, body, requestId) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      ...(requestId ? { 'x-request-id': requestId } : {}),
    },
  });
}

async function mockFetch(input) {
  const request = input instanceof Request ? input : new Request(input);
  const url = new URL(request.url);
  const authorization = request.headers.get('authorization');
  calls.push({ method: request.method, pathname: url.pathname, authorization });

  if (request.method === 'GET' && url.pathname === '/health') {
    return jsonResponse(200, {
      success: true,
      timestamp: ISO_NOW,
      data: {
        service: 'api-nestjs-core',
        status: 'ok',
        timestamp: ISO_NOW,
      },
    });
  }

  if (request.method === 'GET' && url.pathname === '/auth/me') {
    if (authorization !== `Bearer ${ACCESS_TOKEN}`) {
      return jsonResponse(401, {
        success: false,
        statusCode: 401,
        message: 'Unauthorized',
        errorCode: 'AUTH_UNAUTHORIZED',
        path: '/auth/me',
        timestamp: ISO_NOW,
      }, 'example-request-id');
    }

    return jsonResponse(200, {
      success: true,
      timestamp: ISO_NOW,
      data: {
        id: USER_ID,
        email: 'example.user@enistere.test',
        status: 'ACTIVE',
        createdAt: ISO_NOW,
        deactivatedAt: null,
      },
    }, 'example-request-id');
  }

  return jsonResponse(404, {
    success: false,
    statusCode: 404,
    message: 'Not Found',
    errorCode: 'NOT_FOUND',
    path: url.pathname,
    timestamp: ISO_NOW,
  });
}

const session = new InMemorySessionAdapter({
  accessToken: ACCESS_TOKEN,
  refreshToken: 'example-refresh-token',
});

const publicClient = createEnistereApiClient({
  baseUrl: 'https://api.example.invalid',
  fetch: mockFetch,
  enableRefresh: false,
  createRequestId: () => 'example-request-id',
});

const authenticatedClient = createEnistereApiClient({
  baseUrl: 'https://api.example.invalid',
  fetch: mockFetch,
  session,
  enableRefresh: false,
  createRequestId: () => 'example-request-id',
});

const health = await publicClient.raw.GET('/health');
assert.equal(health.response.status, 200);
assert.equal(health.data?.data.status, 'ok');

const profile = await authenticatedClient.auth.getProfile();
assert.equal(profile.id, USER_ID);
assert.equal(profile.email, 'example.user@enistere.test');

assert.deepEqual(calls.map((call) => `${call.method} ${call.pathname}`), [
  'GET /health',
  'GET /auth/me',
]);
assert.equal(calls[0].authorization, null);
assert.equal(calls[1].authorization, `Bearer ${ACCESS_TOKEN}`);

console.log(JSON.stringify({
  status: 'passed',
  example: 'api-client-node',
  calls: calls.map(({ method, pathname }) => ({ method, pathname })),
}, null, 2));
