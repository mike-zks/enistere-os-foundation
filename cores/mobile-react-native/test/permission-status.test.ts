/**
 * Permission model + helpers (RN 9 — native permissions) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PERMISSION_KINDS,
  canRequestPermission,
  isPermissionGranted,
  isPermissionStatus,
  isPermissionUsable,
  normalizePermissionStatus,
  shouldOpenSettings,
  type PermissionStatus,
} from '../src/permissions/status';

test('PERMISSION_KINDS lists the modelled kinds', () => {
  assert.deepEqual([...PERMISSION_KINDS].sort(), [
    'camera',
    'locationForeground',
    'mediaLibrary',
    'notifications',
  ]);
});

test('normalizePermissionStatus folds raw strings', () => {
  const cases: Record<string, PermissionStatus> = {
    granted: 'granted',
    authorized: 'granted',
    denied: 'denied',
    undetermined: 'unknown',
    'not-determined': 'unknown',
    blocked: 'blocked',
    never_ask_again: 'blocked',
    limited: 'limited',
    provisional: 'limited',
    restricted: 'unavailable',
    GRANTED: 'granted',
    somethingElse: 'unknown',
  };
  for (const [raw, expected] of Object.entries(cases)) {
    assert.equal(normalizePermissionStatus(raw), expected, raw);
  }
});

test('normalizePermissionStatus folds Expo-style objects and booleans', () => {
  assert.equal(normalizePermissionStatus({ granted: true, status: 'granted' }), 'granted');
  assert.equal(normalizePermissionStatus({ status: 'denied', canAskAgain: true }), 'denied');
  assert.equal(normalizePermissionStatus({ status: 'denied', canAskAgain: false }), 'blocked');
  assert.equal(normalizePermissionStatus({ granted: false, canAskAgain: false }), 'blocked');
  assert.equal(normalizePermissionStatus({ status: 'undetermined' }), 'unknown');
  assert.equal(normalizePermissionStatus({ status: 'limited' }), 'limited');
  assert.equal(normalizePermissionStatus(true), 'granted');
  assert.equal(normalizePermissionStatus(false), 'denied');
});

test('normalizePermissionStatus is idempotent and conservative', () => {
  for (const s of ['unknown', 'granted', 'denied', 'blocked', 'limited', 'unavailable'] as const) {
    assert.equal(normalizePermissionStatus(s), s);
  }
  for (const weird of [null, undefined, 42, {}, [], Symbol('x')]) {
    assert.equal(normalizePermissionStatus(weird), 'unknown'); // never assumes granted
  }
});

test('canRequestPermission is true only for unknown/denied', () => {
  assert.equal(canRequestPermission('unknown'), true);
  assert.equal(canRequestPermission('denied'), true);
  assert.equal(canRequestPermission('granted'), false);
  assert.equal(canRequestPermission('blocked'), false);
  assert.equal(canRequestPermission('limited'), false);
  assert.equal(canRequestPermission('unavailable'), false);
});

test('isPermissionGranted is strict; isPermissionUsable includes limited', () => {
  assert.equal(isPermissionGranted('granted'), true);
  assert.equal(isPermissionGranted('limited'), false);
  assert.equal(isPermissionUsable('granted'), true);
  assert.equal(isPermissionUsable('limited'), true);
  assert.equal(isPermissionUsable('denied'), false);
});

test('shouldOpenSettings is true only when blocked', () => {
  assert.equal(shouldOpenSettings('blocked'), true);
  assert.equal(shouldOpenSettings('denied'), false);
});

test('isPermissionStatus guards the enum', () => {
  assert.equal(isPermissionStatus('granted'), true);
  assert.equal(isPermissionStatus('nope'), false);
  assert.equal(isPermissionStatus(null), false);
});
