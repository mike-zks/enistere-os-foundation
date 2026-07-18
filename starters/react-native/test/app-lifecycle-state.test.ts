/**
 * App-lifecycle state model (RN 15 — app lifecycle) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  isAppLifecycleState,
  isBackground,
  isForeground,
  isValidTransition,
  nextAppLifecycleState,
  normalizeAppLifecycleState,
} from '../src/app-lifecycle/state';

test('normalizeAppLifecycleState folds RN AppState values (incl. extension)', () => {
  assert.equal(normalizeAppLifecycleState('active'), 'active');
  assert.equal(normalizeAppLifecycleState('BACKGROUND'), 'background');
  assert.equal(normalizeAppLifecycleState('  Inactive '), 'inactive');
  assert.equal(normalizeAppLifecycleState('extension'), 'background');
  assert.equal(normalizeAppLifecycleState('unknown'), 'unknown');
});

test('normalizeAppLifecycleState is conservative on invalid input (never throws)', () => {
  for (const value of ['nope', '', '   ', null, undefined, 42, {}, []]) {
    assert.equal(normalizeAppLifecycleState(value), 'unknown', String(value));
  }
});

test('isAppLifecycleState guards the enum', () => {
  assert.equal(isAppLifecycleState('active'), true);
  assert.equal(isAppLifecycleState('extension'), false); // raw, not normalised
  assert.equal(isAppLifecycleState(null), false);
});

test('isForeground / isBackground', () => {
  assert.equal(isForeground('active'), true);
  assert.equal(isForeground('inactive'), false);
  assert.equal(isBackground('background'), true);
  assert.equal(isBackground('active'), false);
});

test('isValidTransition matrix', () => {
  // same-state no-op
  assert.equal(isValidTransition('active', 'active'), true);
  // unknown -> anything (initial determination)
  assert.equal(isValidTransition('unknown', 'active'), true);
  assert.equal(isValidTransition('unknown', 'background'), true);
  // a determined state never reverts to unknown
  assert.equal(isValidTransition('active', 'unknown'), false);
  assert.equal(isValidTransition('background', 'unknown'), false);
  // real states interchange freely
  assert.equal(isValidTransition('active', 'inactive'), true);
  assert.equal(isValidTransition('inactive', 'background'), true);
  assert.equal(isValidTransition('background', 'active'), true);
});

test('nextAppLifecycleState applies valid, ignores invalid, tolerates garbage', () => {
  assert.equal(nextAppLifecycleState('unknown', 'active'), 'active'); // valid
  assert.equal(nextAppLifecycleState('active', 'background'), 'background'); // valid
  assert.equal(nextAppLifecycleState('active', 'unknown'), 'active'); // invalid -> keep
  assert.equal(nextAppLifecycleState('active', 'garbage'), 'active'); // garbage -> unknown -> keep
  assert.equal(nextAppLifecycleState('garbage', 'active'), 'active'); // current garbage -> unknown -> any
  assert.equal(nextAppLifecycleState(null, undefined), 'unknown'); // both garbage
});
