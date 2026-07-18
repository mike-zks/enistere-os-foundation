/**
 * Cache invalidation & deterministic logout purge (RN 6) — `node --test`.
 *
 * `invalidation.ts` imports `QueryClient` as a TYPE only, so it runs under Node
 * with a stub client (no `@tanstack/react-query` runtime needed).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { QueryClient } from '@tanstack/react-query';

import { invalidateScope, purgeServerState, removeScope } from '../src/query/invalidation';

test('purgeServerState awaits cancelQueries THEN clears (deterministic order)', async () => {
  const calls: string[] = [];
  const stub = {
    cancelQueries: async () => {
      calls.push('cancel:start');
      await Promise.resolve();
      calls.push('cancel:end');
    },
    clear: () => {
      calls.push('clear');
    },
  };
  await purgeServerState(stub as unknown as QueryClient);
  // clear() runs ONLY after cancelQueries() has fully resolved.
  assert.deepEqual(calls, ['cancel:start', 'cancel:end', 'clear']);
});

test('invalidateScope invalidates by query key', async () => {
  let received: unknown;
  const stub = {
    invalidateQueries: async (filters: unknown) => {
      received = filters;
    },
  };
  await invalidateScope(stub as unknown as QueryClient, ['users', 'list']);
  assert.deepEqual(received, { queryKey: ['users', 'list'] });
});

test('removeScope removes by query key', () => {
  let received: unknown;
  const stub = {
    removeQueries: (filters: unknown) => {
      received = filters;
    },
  };
  removeScope(stub as unknown as QueryClient, ['users', 'detail', 'u1']);
  assert.deepEqual(received, { queryKey: ['users', 'detail', 'u1'] });
});
