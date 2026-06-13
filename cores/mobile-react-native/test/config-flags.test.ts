/**
 * Feature-flag model + typed getters (RN 17 — feature flags / config) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  MAX_FLAGS,
  MAX_FLAG_VALUE_LENGTH,
  describeFlagsForLog,
  getBooleanFlag,
  getFlagValue,
  getNumberFlag,
  getStringFlag,
  isValidFlagKey,
  normalizeFlagValue,
  sanitizeFlagSet,
} from '../src/config/flag-model';

test('isValidFlagKey accepts identifiers, rejects junk/oversized', () => {
  for (const key of ['feature.newCheckout', 'a', 'x_y-z.1']) {
    assert.equal(isValidFlagKey(key), true, key);
  }
  for (const key of ['', ' bad', '.lead', 'with space', 42, null, 'x'.repeat(100)]) {
    assert.equal(isValidFlagKey(key), false, String(key));
  }
});

test('normalizeFlagValue keeps primitives, bounds strings, drops the rest', () => {
  assert.equal(normalizeFlagValue(true), true);
  assert.equal(normalizeFlagValue(0), 0);
  assert.equal(normalizeFlagValue('on'), 'on');
  const bounded = normalizeFlagValue('y'.repeat(MAX_FLAG_VALUE_LENGTH + 10));
  assert.equal(typeof bounded === 'string' ? bounded.length : -1, MAX_FLAG_VALUE_LENGTH);
  assert.equal(normalizeFlagValue(Number.NaN), undefined);
  assert.equal(normalizeFlagValue(Infinity), undefined);
  for (const value of [null, undefined, {}, [], () => 1]) {
    assert.equal(normalizeFlagValue(value), undefined, String(value));
  }
});

test('sanitizeFlagSet keeps valid keys/primitives, drops invalid, caps count', () => {
  const set = sanitizeFlagSet({
    'feature.a': true,
    'feature.b': 'x',
    'feature.c': 3,
    'bad key': 1, // invalid key
    nested: { x: 1 }, // non-primitive value
    n: Number.NaN, // dropped
  });
  assert.deepEqual(set, { 'feature.a': true, 'feature.b': 'x', 'feature.c': 3 });

  const big: Record<string, number> = {};
  for (let i = 0; i < MAX_FLAGS + 10; i += 1) {
    big[`k${i}`] = i;
  }
  assert.ok(Object.keys(sanitizeFlagSet(big)).length <= MAX_FLAGS);
});

test('sanitizeFlagSet tolerates invalid input', () => {
  for (const value of [null, undefined, 42, 'str', []]) {
    assert.deepEqual(sanitizeFlagSet(value), {});
  }
});

test('typed getters return the value only when the type matches (safe defaults)', () => {
  const set = sanitizeFlagSet({ b: true, s: 'hi', n: 7 });
  assert.equal(getBooleanFlag(set, 'b', false), true);
  assert.equal(getBooleanFlag(set, 's', false), false); // mistyped -> default
  assert.equal(getBooleanFlag(set, 'missing', true), true);
  assert.equal(getStringFlag(set, 's', 'def'), 'hi');
  assert.equal(getStringFlag(set, 'n', 'def'), 'def'); // mistyped -> default
  assert.equal(getNumberFlag(set, 'n', 0), 7);
  assert.equal(getNumberFlag(set, 'b', -1), -1); // mistyped -> default
  // generic getFlagValue mirrors the type-match rule
  assert.equal(getFlagValue(set, 'b', false), true);
  assert.equal(getFlagValue(set, 'b', 'x'), 'x'); // type mismatch -> default
});

test('describeFlagsForLog exposes a count ONLY (no keys/values)', () => {
  const safe = describeFlagsForLog(sanitizeFlagSet({ 'feature.secret': 'secret-xyz', n: 1 }));
  assert.deepEqual(safe, { count: 2 });
  assert.ok(!JSON.stringify(safe).includes('secret-xyz'));
  assert.ok(!JSON.stringify(safe).includes('feature.secret'));
});
