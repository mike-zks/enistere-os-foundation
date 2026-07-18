/**
 * ApiClientError → UI normalisation (RN 5) — `node --test`.
 *
 * Stubs the official `ApiClientError` structurally (the helper is agnostic).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { toQueryError } from '../src/query/query-errors';

/** Minimal ApiClientError-shaped stub. */
function apiError(fields: Record<string, unknown>): unknown {
  return { name: 'ApiClientError', ...fields };
}

test('maps a 401 to an unauthorized, safe error', () => {
  const e = toQueryError(apiError({ kind: 'http', status: 401, errorCode: 'AUTH_X', requestId: 'rid-1' }));
  assert.equal(e.kind, 'http');
  assert.equal(e.status, 401);
  assert.equal(e.errorCode, 'AUTH_X');
  assert.equal(e.requestId, 'rid-1');
  assert.equal(e.isUnauthorized, true);
  assert.equal(e.isForbidden, false);
  assert.ok(e.message.length > 0);
});

test('classifies 403 / 404', () => {
  assert.equal(toQueryError(apiError({ kind: 'http', status: 403 })).isForbidden, true);
  assert.equal(toQueryError(apiError({ kind: 'http', status: 404 })).isNotFound, true);
});

test('session_expired is treated as unauthorized even without a status', () => {
  const e = toQueryError(apiError({ kind: 'session_expired', status: null }));
  assert.equal(e.kind, 'session_expired');
  assert.equal(e.isUnauthorized, true);
  assert.match(e.message, /session/i);
});

test('network / timeout carry their kind and a matching message', () => {
  assert.match(toQueryError(apiError({ kind: 'network', status: null })).message, /network/i);
  assert.match(toQueryError(apiError({ kind: 'timeout', status: null })).message, /timed out/i);
});

test('5xx → temporarily unavailable', () => {
  assert.match(toQueryError(apiError({ kind: 'http', status: 503 })).message, /unavailable/i);
});

test('413 / 415 map to upload-friendly messages', () => {
  assert.match(toQueryError(apiError({ kind: 'http', status: 413 })).message, /too large/i);
  assert.match(toQueryError(apiError({ kind: 'http', status: 415 })).message, /not supported/i);
});

test('NEVER echoes the raw error message (no sensitive data leak)', () => {
  const e = toQueryError(
    apiError({ kind: 'http', status: 400, message: 'Bearer secret-token-abc123 leaked' }),
  );
  assert.ok(!e.message.includes('secret-token-abc123'));
  assert.ok(!e.message.includes('Bearer'));
});

test('non-ApiClientError values normalise to a generic unknown error', () => {
  for (const value of [new Error('boom'), null, undefined, 'nope', 42]) {
    const e = toQueryError(value);
    assert.equal(e.kind, 'unknown');
    assert.equal(e.status, null);
    assert.equal(e.isUnauthorized, false);
    assert.ok(e.message.length > 0);
  }
});
