/**
 * Generic query-key factory (RN 5) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createQueryKeys, normalizeParams } from '../src/query/query-keys';

test('scopes keys under the namespace', () => {
  const keys = createQueryKeys('users');
  assert.deepEqual(keys.all, ['users']);
  assert.deepEqual(keys.lists(), ['users', 'list']);
  assert.deepEqual(keys.details(), ['users', 'detail']);
  assert.deepEqual(keys.detail('u1'), ['users', 'detail', 'u1']);
  assert.deepEqual(keys.detail(42), ['users', 'detail', 42]);
  assert.deepEqual(keys.of('extra', 1, true), ['users', 'extra', 1, true]);
});

test('list() without params omits the params segment', () => {
  const keys = createQueryKeys('items');
  assert.deepEqual(keys.list(), ['items', 'list']);
});

test('list(params) is STABLE regardless of key order (cache hit)', () => {
  const keys = createQueryKeys('items');
  assert.deepEqual(keys.list({ b: 2, a: 1 }), ['items', 'list', { a: 1, b: 2 }]);
  assert.deepEqual(keys.list({ a: 1, b: 2 }), keys.list({ b: 2, a: 1 }));
});

test('normalizeParams sorts keys and drops undefined', () => {
  assert.deepEqual(normalizeParams({ c: 3, a: 1, b: undefined }), { a: 1, c: 3 });
  assert.deepEqual(normalizeParams({ a: 1, b: 2 }), normalizeParams({ b: 2, a: 1 }));
});

test('two distinct scopes never collide', () => {
  assert.notDeepEqual(createQueryKeys('a').all, createQueryKeys('b').all);
  assert.notDeepEqual(createQueryKeys('a').detail('x'), createQueryKeys('b').detail('x'));
});
