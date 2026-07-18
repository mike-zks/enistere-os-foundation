/**
 * Analytics event model + redaction (RN 13) — `node --test`.
 *
 * The security core: proves sensitive keys/values never survive sanitisation.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  MAX_PROPERTIES,
  MAX_PROPERTY_VALUE_LENGTH,
  describeAnalyticsEventForLog,
  isSensitiveProperty,
  sanitizeAnalyticsEvent,
} from '../src/analytics/event';

test('isSensitiveProperty matches RN8 keys + substring/exact hardening', () => {
  for (const key of [
    'token',
    'access_token',
    'refreshToken',
    'authorization',
    'X-Amz-Signature',
    'apiKey',
    'password',
    'email',
    'phone',
    'user_secret',
    'sessionId',
    'cvv',
  ]) {
    assert.equal(isSensitiveProperty(key), true, key);
  }
  for (const key of ['screen', 'durationMs', 'count', 'tabName', 'index']) {
    assert.equal(isSensitiveProperty(key), false, key);
  }
});

test('sanitizeAnalyticsEvent keeps primitives and a name', () => {
  const event = sanitizeAnalyticsEvent({
    name: 'screen_view',
    properties: { screen: 'home', index: 3, active: true },
  });
  assert.equal(event.name, 'screen_view');
  assert.deepEqual(event.properties, { screen: 'home', index: 3, active: true });
});

test('sanitizeAnalyticsEvent scrubs sensitive substrings inside the event name', () => {
  const event = sanitizeAnalyticsEvent({
    name: 'opened jane.doe@example.com with Bearer secret-xyz',
  });
  assert.ok(!event.name.includes('jane.doe@example.com'));
  assert.ok(!event.name.includes('secret-xyz'));
  assert.match(event.name, /\[Redacted\]/);
});

test('sanitizeAnalyticsEvent drops sensitive keys and non-primitive values', () => {
  const event = sanitizeAnalyticsEvent({
    name: 'login',
    properties: {
      method: 'password-form',
      token: 'secret-xyz',
      access_token: 'abc',
      Signature: 'zzz',
      nested: { a: 1 },
      fn: () => 1,
      arr: [1, 2],
      missing: null,
    },
  });
  assert.deepEqual(event.properties, { method: 'password-form' });
  assert.ok(!JSON.stringify(event).includes('secret-xyz'));
});

test('sanitizeAnalyticsEvent scrubs sensitive substrings inside string values (RN8)', () => {
  const event = sanitizeAnalyticsEvent({
    name: 'open',
    properties: {
      url: 'https://x.example.com/p?token=secret-xyz',
      note: 'ping jane.doe@example.com',
      header: 'Bearer secret-xyz',
    },
  });
  const serialised = JSON.stringify(event);
  assert.ok(!serialised.includes('secret-xyz'), 'token value scrubbed');
  assert.ok(!serialised.includes('jane.doe@example.com'), 'email scrubbed');
  assert.match(String(event.properties?.header), /Bearer \[Redacted\]/);
});

test('sanitizeAnalyticsEvent bounds property count and value length', () => {
  const properties: Record<string, unknown> = {};
  for (let i = 0; i < MAX_PROPERTIES + 10; i += 1) {
    properties[`k${i}`] = i;
  }
  properties.long = 'x'.repeat(MAX_PROPERTY_VALUE_LENGTH + 100);
  const event = sanitizeAnalyticsEvent({ name: 'e', properties });
  assert.ok(Object.keys(event.properties ?? {}).length <= MAX_PROPERTIES);
});

test('sanitizeAnalyticsEvent truncates a long string value', () => {
  const event = sanitizeAnalyticsEvent({
    name: 'e',
    properties: { big: 'y'.repeat(MAX_PROPERTY_VALUE_LENGTH + 50) },
  });
  assert.equal(String(event.properties?.big).length, MAX_PROPERTY_VALUE_LENGTH);
});

test('sanitizeAnalyticsEvent never throws on invalid input', () => {
  for (const value of [null, undefined, 42, 'str', [], { name: 99 }]) {
    const event = sanitizeAnalyticsEvent(value);
    assert.equal(typeof event.name, 'string');
    assert.ok(event.name.length > 0); // 'unknown' fallback
  }
  // keeps a numeric timestamp, drops a non-numeric one
  assert.equal(sanitizeAnalyticsEvent({ name: 'e', timestamp: 123 }).timestamp, 123);
  assert.equal('timestamp' in sanitizeAnalyticsEvent({ name: 'e', timestamp: 'no' }), false);
});

test('describeAnalyticsEventForLog returns name + count only (no values)', () => {
  const safe = describeAnalyticsEventForLog(
    sanitizeAnalyticsEvent({ name: 'e', properties: { a: 'secret-xyz', b: 2 } }),
  );
  assert.deepEqual(safe, { eventName: 'e', propertyCount: 2 });
  assert.ok(!JSON.stringify(safe).includes('secret-xyz'));
});
