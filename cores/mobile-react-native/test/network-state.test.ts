/**
 * Abstract network-state helpers (RN 3) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  networkState,
  initialNetworkState,
  isOnline,
  isOffline,
  shouldQueueMutations,
} from '../src/offline/network-state';

test('the initial state is unknown', () => {
  assert.equal(initialNetworkState.status, 'unknown');
  assert.equal(initialNetworkState.changedAt, null);
});

test('isOnline / isOffline reflect the status only when positively known', () => {
  assert.equal(isOnline(networkState('online', 5)), true);
  assert.equal(isOnline(networkState('offline')), false);
  assert.equal(isOnline(networkState('unknown')), false);
  assert.equal(isOffline(networkState('offline')), true);
  assert.equal(isOffline(networkState('online')), false);
  assert.equal(isOffline(networkState('unknown')), false);
});

test('shouldQueueMutations queues unless positively online (conservative)', () => {
  assert.equal(shouldQueueMutations(networkState('online')), false);
  assert.equal(shouldQueueMutations(networkState('offline')), true);
  assert.equal(shouldQueueMutations(networkState('unknown')), true);
});
