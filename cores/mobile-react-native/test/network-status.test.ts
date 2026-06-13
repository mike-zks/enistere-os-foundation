/**
 * Network connectivity normalisation + RN 3 compatibility (RN 16) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  networkState,
  normalizeConnectionType,
  normalizeNetworkStatus,
  shouldQueueMutations,
} from '../src/offline/network-state';

test('normalizeNetworkStatus folds booleans, strings and tolerates garbage', () => {
  assert.equal(normalizeNetworkStatus(true), 'online');
  assert.equal(normalizeNetworkStatus(false), 'offline');
  assert.equal(normalizeNetworkStatus('online'), 'online');
  assert.equal(normalizeNetworkStatus('CONNECTED'), 'online');
  assert.equal(normalizeNetworkStatus('offline'), 'offline');
  assert.equal(normalizeNetworkStatus('disconnected'), 'offline');
  assert.equal(normalizeNetworkStatus('none'), 'offline');
  assert.equal(normalizeNetworkStatus('unknown'), 'unknown');
  for (const value of ['nope', '', null, undefined, 42, {}]) {
    assert.equal(normalizeNetworkStatus(value), 'unknown', String(value));
  }
});

test('normalizeConnectionType folds known types; unknown string -> other', () => {
  assert.equal(normalizeConnectionType('wifi'), 'wifi');
  assert.equal(normalizeConnectionType('CELL'), 'cellular');
  assert.equal(normalizeConnectionType('mobile'), 'cellular');
  assert.equal(normalizeConnectionType('ethernet'), 'ethernet');
  assert.equal(normalizeConnectionType('none'), 'none');
  assert.equal(normalizeConnectionType('vpn'), 'other'); // unrecognised non-empty
  for (const value of [null, undefined, 42, '', {}]) {
    assert.equal(normalizeConnectionType(value), 'unknown', String(value));
  }
});

test('networkState carries an optional type without breaking the RN 3 shape', () => {
  assert.deepEqual(networkState('online', 5), { status: 'online', changedAt: 5 });
  assert.deepEqual(networkState('online', 5, 'wifi'), { status: 'online', changedAt: 5, type: 'wifi' });
});

test('RN 3 compatibility: shouldQueueMutations queues unless positively online', () => {
  assert.equal(shouldQueueMutations(networkState('online', 1, 'wifi')), false);
  assert.equal(shouldQueueMutations(networkState('offline', 1)), true);
  assert.equal(shouldQueueMutations(networkState('unknown')), true);
});
