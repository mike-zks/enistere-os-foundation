/**
 * Biometric-gate model + pure helpers (RN 18 — biometric gate) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  describeAuthResultForLog,
  describeAvailabilityForLog,
  isAuthSuccess,
  isAvailabilityUsable,
  isBiometricAuthOutcome,
  isBiometricAvailability,
  isBiometricType,
  normalizeAuthResult,
  normalizeAvailabilityState,
  normalizeBiometricAuthOutcome,
  normalizeBiometricAvailability,
  normalizeBiometricType,
} from '../src/biometrics/model';

test('normalizeBiometricAvailability folds aliases/booleans, junk → unknown', () => {
  assert.equal(normalizeBiometricAvailability('available'), 'available');
  assert.equal(normalizeBiometricAvailability('ENROLLED'), 'available');
  assert.equal(normalizeBiometricAvailability('not_enrolled'), 'notEnrolled');
  assert.equal(normalizeBiometricAvailability('no_hardware'), 'unsupported');
  assert.equal(normalizeBiometricAvailability(true), 'available');
  assert.equal(normalizeBiometricAvailability(false), 'unsupported');
  for (const junk of [null, undefined, 42, {}, [], 'nope']) {
    assert.equal(normalizeBiometricAvailability(junk), 'unknown', String(junk));
  }
});

test('normalizeBiometricType folds aliases, junk → unknown', () => {
  assert.equal(normalizeBiometricType('TouchID'), 'fingerprint');
  assert.equal(normalizeBiometricType('face_id'), 'facial');
  assert.equal(normalizeBiometricType('iris'), 'iris');
  for (const junk of [null, undefined, 1, {}, 'retina']) {
    assert.equal(normalizeBiometricType(junk), 'unknown', String(junk));
  }
});

test('normalizeBiometricAuthOutcome never invents success: junk → error', () => {
  assert.equal(normalizeBiometricAuthOutcome('success'), 'success');
  assert.equal(normalizeBiometricAuthOutcome('AUTHENTICATED'), 'success');
  assert.equal(normalizeBiometricAuthOutcome('user_cancel'), 'cancelled');
  assert.equal(normalizeBiometricAuthOutcome('too_many_attempts'), 'lockout');
  assert.equal(normalizeBiometricAuthOutcome('failed'), 'refused');
  assert.equal(normalizeBiometricAuthOutcome('not_available'), 'unavailable');
  for (const junk of [null, undefined, 0, {}, [], 'weird', 'unknown']) {
    assert.equal(normalizeBiometricAuthOutcome(junk), 'error', String(junk));
  }
});

test('type guards accept only the normalised enums', () => {
  assert.equal(isBiometricAvailability('available'), true);
  assert.equal(isBiometricAvailability('enrolled'), false); // alias, not canonical
  assert.equal(isBiometricType('facial'), true);
  assert.equal(isBiometricType('face'), false);
  assert.equal(isBiometricAuthOutcome('lockout'), true);
  assert.equal(isBiometricAuthOutcome('locked'), false);
  for (const v of [null, undefined, 1, {}]) {
    assert.equal(isBiometricAvailability(v), false);
    assert.equal(isBiometricAuthOutcome(v), false);
  }
});

test('normalizeAvailabilityState returns a frozen normalised state, tolerant', () => {
  const s = normalizeAvailabilityState({ availability: 'enrolled', biometricType: 'TouchID' });
  assert.deepEqual({ ...s }, { availability: 'available', biometricType: 'fingerprint' });
  assert.ok(Object.isFrozen(s));
  // tolerates garbage
  assert.deepEqual({ ...normalizeAvailabilityState(null) }, {
    availability: 'unknown',
    biometricType: 'unknown',
  });
  assert.deepEqual({ ...normalizeAvailabilityState(42) }, {
    availability: 'unknown',
    biometricType: 'unknown',
  });
});

test('normalizeAuthResult accepts a string or a {outcome}, frozen, junk → error', () => {
  assert.deepEqual({ ...normalizeAuthResult('cancelled') }, { outcome: 'cancelled' });
  assert.deepEqual({ ...normalizeAuthResult({ outcome: 'lockout' }) }, { outcome: 'lockout' });
  assert.deepEqual({ ...normalizeAuthResult(null) }, { outcome: 'error' });
  assert.deepEqual({ ...normalizeAuthResult({ outcome: 'bogus' }) }, { outcome: 'error' });
  assert.ok(Object.isFrozen(normalizeAuthResult('success')));
});

test('isAvailabilityUsable is true ONLY for available; isAuthSuccess ONLY for success', () => {
  assert.equal(isAvailabilityUsable('available'), true);
  for (const a of ['notEnrolled', 'unsupported', 'unknown', null, 'garbage']) {
    assert.equal(isAvailabilityUsable(a), false, String(a));
  }
  assert.equal(isAuthSuccess('success'), true);
  for (const o of ['refused', 'cancelled', 'lockout', 'unavailable', 'error', null, 'x']) {
    assert.equal(isAuthSuccess(o), false, String(o));
  }
});

test('describe*ForLog expose enums ONLY (no identity, prompt or cause)', () => {
  const availDesc = describeAvailabilityForLog(
    normalizeAvailabilityState({ availability: 'available', biometricType: 'facial' }),
  );
  assert.deepEqual(availDesc, { availability: 'available', type: 'facial' });

  const resultDesc = describeAuthResultForLog(normalizeAuthResult('refused'));
  assert.deepEqual(resultDesc, { outcome: 'refused' });
  assert.deepEqual(Object.keys(resultDesc), ['outcome']);
});
