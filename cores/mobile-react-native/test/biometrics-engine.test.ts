/**
 * Biometric-gate service + placeholder adapter (RN 18 — biometric gate) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createLogger, type LogRecord } from '../src/logger/logger';
import { createBiometricService } from '../src/biometrics/engine';
import { createPlaceholderBiometricAdapter } from '../src/biometrics/placeholder-adapter';
import type { BiometricAdapter } from '../src/biometrics';

test('getAvailability / isAvailable reflect the device, frozen result', async () => {
  const adapter = createPlaceholderBiometricAdapter({ availability: 'available', biometricType: 'facial' });
  const service = createBiometricService({ adapter });
  const state = await service.getAvailability();
  assert.deepEqual({ ...state }, { availability: 'available', biometricType: 'facial' });
  assert.ok(Object.isFrozen(state));
  assert.equal(await service.isAvailable(), true);

  adapter.setAvailability('notEnrolled');
  assert.equal(await service.isAvailable(), false);
});

test('authenticate returns the device outcome when available', async () => {
  const adapter = createPlaceholderBiometricAdapter({ availability: 'available' });
  const service = createBiometricService({ adapter });

  for (const outcome of ['success', 'refused', 'cancelled', 'lockout', 'error'] as const) {
    adapter.setNextOutcome(outcome);
    const result = await service.authenticate({ reason: 'Unlock your vault' });
    assert.equal(result.outcome, outcome, outcome);
    assert.ok(Object.isFrozen(result));
  }
});

test('no false success: an unusable device returns unavailable WITHOUT prompting', async () => {
  for (const availability of ['notEnrolled', 'unsupported', 'unknown'] as const) {
    const adapter = createPlaceholderBiometricAdapter({ availability });
    adapter.setNextOutcome('success'); // even if the device would "succeed"
    const service = createBiometricService({ adapter });
    const result = await service.authenticate({ reason: 'x' });
    assert.equal(result.outcome, 'unavailable', availability);
    assert.equal(adapter.authenticateCalls, 0, `must not prompt when ${availability}`);
  }
});

test('a controlled getAvailability error → unknown availability, never throws', async () => {
  const adapter: BiometricAdapter = {
    getAvailability: () => Promise.reject(new Error('native boom')),
    authenticate: () => Promise.resolve({ outcome: 'success' }),
  };
  const service = createBiometricService({ adapter });
  const state = await service.getAvailability();
  assert.equal(state.availability, 'unknown');
  assert.equal(await service.isAvailable(), false);
  // gate is closed → unavailable, adapter.authenticate never reached
  const result = await service.authenticate();
  assert.equal(result.outcome, 'unavailable');
});

test('a controlled authenticate error → error outcome, never throws', async () => {
  const adapter: BiometricAdapter = {
    getAvailability: () => Promise.resolve({ availability: 'available', biometricType: 'fingerprint' }),
    authenticate: () => Promise.reject(new Error('native boom')),
  };
  const service = createBiometricService({ adapter });
  const result = await service.authenticate();
  assert.equal(result.outcome, 'error');
});

test('junk outcomes from the adapter normalise to error (never success)', async () => {
  const adapter: BiometricAdapter = {
    getAvailability: () => Promise.resolve({ availability: 'available', biometricType: 'iris' }),
    authenticate: () => Promise.resolve({ outcome: 'totally-bogus' } as never),
  };
  const service = createBiometricService({ adapter });
  assert.equal((await service.authenticate()).outcome, 'error');
});

test('the logger only ever sees safe enums — never the prompt reason or a native cause', async () => {
  const records: LogRecord[] = [];
  const logger = createLogger({
    level: 'debug',
    sink: (record) => records.push(record),
    clock: () => 1_700_000_000_000,
  });
  const adapter = createPlaceholderBiometricAdapter({ availability: 'available', biometricType: 'facial' });
  adapter.setNextOutcome('refused');
  const service = createBiometricService({ adapter, logger });
  await service.authenticate({ reason: 'Confirme ton identité Bailo' });

  const serialised = JSON.stringify(records);
  assert.ok(!serialised.includes('Bailo'), 'prompt reason must never be logged');
  assert.ok(!serialised.includes('identité'), 'prompt reason must never be logged');
  const allowedKeys = new Set(['availability', 'type', 'outcome', 'operation']);
  for (const record of records) {
    for (const key of Object.keys(record.fields ?? {})) {
      assert.ok(allowedKeys.has(key), `unexpected logged field: ${key}`);
    }
  }
});

test('adapter errors are logged with the operation only (no cause)', async () => {
  const records: LogRecord[] = [];
  const logger = createLogger({ level: 'debug', sink: (r) => records.push(r), clock: () => 1 });
  const adapter: BiometricAdapter = {
    getAvailability: () => Promise.resolve({ availability: 'available', biometricType: 'fingerprint' }),
    authenticate: () => Promise.reject(new Error('secret native detail')),
  };
  const service = createBiometricService({ adapter, logger });
  await service.authenticate();
  const serialised = JSON.stringify(records);
  assert.ok(!serialised.includes('secret native detail'));
  const warn = records.find((r) => r.level === 'warn');
  assert.deepEqual(warn?.fields, { operation: 'authenticate' });
});

test('placeholder setAvailability/setNextOutcome drive the gate; calls are counted', async () => {
  const adapter = createPlaceholderBiometricAdapter();
  const service = createBiometricService({ adapter });
  assert.equal(await service.isAvailable(), false); // default unknown
  adapter.setAvailability('available', 'fingerprint');
  adapter.setNextOutcome('success');
  assert.equal((await service.authenticate()).outcome, 'success');
  assert.equal(adapter.authenticateCalls, 1);
});
