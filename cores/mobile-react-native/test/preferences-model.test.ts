/**
 * Non-sensitive preference model + anti-secret guard (RN 20) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  MAX_PREFERENCES,
  MAX_PREFERENCE_VALUE_LENGTH,
  describePreferencesForLog,
  getBooleanPreference,
  getNumberPreference,
  getPreferenceValue,
  getStringPreference,
  isSensitivePreferenceValue,
  isValidPreferenceKey,
  normalizePreferenceValue,
  sanitizePreferenceSet,
} from '../src/preferences/model';

const SENSITIVE_KEYS = [
  'token',
  'accessToken',
  'refresh_token',
  'password',
  'email',
  'phone',
  'signedUrl',
  'apiKey',
];

test('isValidPreferenceKey accepts identifiers, rejects junk/oversized/sensitive', () => {
  for (const key of ['theme', 'locale', 'onboarding.seen', 'filters_v2', 'a-b.c']) {
    assert.equal(isValidPreferenceKey(key), true, key);
  }
  for (const key of ['', ' bad', '.lead', 'with space', 42, null, 'x'.repeat(100)]) {
    assert.equal(isValidPreferenceKey(key), false, String(key));
  }
  // sensitive keys are never valid preference keys
  for (const key of SENSITIVE_KEYS) {
    assert.equal(isValidPreferenceKey(key), false, key);
  }
});

test('normalizePreferenceValue keeps primitives, bounds strings, drops the rest', () => {
  assert.equal(normalizePreferenceValue(true), true);
  assert.equal(normalizePreferenceValue(0), 0);
  assert.equal(normalizePreferenceValue('system'), 'system');
  const bounded = normalizePreferenceValue('y'.repeat(MAX_PREFERENCE_VALUE_LENGTH + 10));
  assert.equal(typeof bounded === 'string' ? bounded.length : -1, MAX_PREFERENCE_VALUE_LENGTH);
  assert.equal(normalizePreferenceValue(Number.NaN), undefined);
  assert.equal(normalizePreferenceValue(Infinity), undefined);
  for (const value of [null, undefined, {}, [], () => 1]) {
    assert.equal(normalizePreferenceValue(value), undefined, String(value));
  }
});

test('isSensitivePreferenceValue flags secret-shaped strings (never booleans/numbers)', () => {
  for (const value of [
    'Bearer abcdefghij.klmnopqrst.uvwxyz',
    'aaaaaaaaaa.bbbbbbbbbb.cccccc', // JWT-shaped
    'mail me at user@host.com',
    'https://x.io/d?X-Amz-Signature=abc&token=zzz',
    'file:///data/user/0/app/secret.png',
  ]) {
    assert.equal(isSensitivePreferenceValue(value), true, value);
  }
  for (const value of ['system', 'fr-FR', 'grid', true, false, 42] as const) {
    assert.equal(isSensitivePreferenceValue(value), false, String(value));
  }
});

test('sanitizePreferenceSet drops invalid/sensitive keys AND sensitive values, caps count', () => {
  const set = sanitizePreferenceSet({
    theme: 'dark',
    fontScale: 1.2,
    reduceMotion: true,
    accessToken: 'should-drop', // sensitive key
    'bad key': 1, // invalid key
    note: 'contact user@host.com', // sensitive value (email) → dropped
    nested: { x: 1 }, // non-primitive → dropped
  });
  assert.deepEqual(set, { theme: 'dark', fontScale: 1.2, reduceMotion: true });
  assert.ok(Object.isFrozen(set));

  for (const junk of [null, undefined, 42, 'str', []]) {
    assert.deepEqual({ ...sanitizePreferenceSet(junk) }, {});
  }
  const big: Record<string, number> = {};
  for (let i = 0; i < MAX_PREFERENCES + 10; i += 1) {
    big[`k${i}`] = i;
  }
  assert.ok(Object.keys(sanitizePreferenceSet(big)).length <= MAX_PREFERENCES);
});

test('typed getters return the value only when the type matches (safe defaults)', () => {
  const set = sanitizePreferenceSet({ b: true, s: 'hi', n: 7 });
  assert.equal(getBooleanPreference(set, 'b', false), true);
  assert.equal(getBooleanPreference(set, 's', false), false);
  assert.equal(getBooleanPreference(set, 'missing', true), true);
  assert.equal(getStringPreference(set, 's', 'def'), 'hi');
  assert.equal(getStringPreference(set, 'n', 'def'), 'def');
  assert.equal(getNumberPreference(set, 'n', 0), 7);
  assert.equal(getNumberPreference(set, 'b', -1), -1);
  assert.equal(getPreferenceValue(set, 'b', false), true);
  assert.equal(getPreferenceValue(set, 'b', 'x'), 'x'); // type mismatch → default
});

test('describePreferencesForLog exposes a count ONLY (no keys/values)', () => {
  const safe = describePreferencesForLog(sanitizePreferenceSet({ theme: 'dark', fontScale: 2 }));
  assert.deepEqual(safe, { count: 2 });
  assert.ok(!JSON.stringify(safe).includes('theme'));
  assert.ok(!JSON.stringify(safe).includes('dark'));
});
