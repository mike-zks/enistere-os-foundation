/**
 * Notification message + types (RN 10 — notifications) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  MAX_BODY_LENGTH,
  MAX_DATA_KEYS,
  MAX_TITLE_LENGTH,
  describeNotificationForLog,
  isNotificationMessage,
  sanitizeNotificationMessage,
} from '../src/notifications/message';
import {
  isNotificationDeliveryState,
  isTerminalDeliveryState,
  normalizeTrigger,
} from '../src/notifications/types';

test('isNotificationMessage requires a non-empty title and a string body', () => {
  assert.equal(isNotificationMessage({ title: 'Hi', body: '' }), true);
  assert.equal(isNotificationMessage({ title: '   ', body: 'x' }), false);
  assert.equal(isNotificationMessage({ title: 'Hi' }), false);
  assert.equal(isNotificationMessage(null), false);
});

test('sanitizeNotificationMessage trims and caps title/body', () => {
  const msg = sanitizeNotificationMessage({
    title: `  ${'T'.repeat(MAX_TITLE_LENGTH + 50)}  `,
    body: 'B'.repeat(MAX_BODY_LENGTH + 50),
  });
  assert.equal(msg.title.length, MAX_TITLE_LENGTH);
  assert.equal(msg.body.length, MAX_BODY_LENGTH);
  assert.equal(msg.data, undefined);
});

test('sanitizeNotificationMessage keeps only primitive, bounded data', () => {
  const msg = sanitizeNotificationMessage({
    title: 'T',
    body: 'B',
    data: {
      a: 'x',
      n: 42,
      b: true,
      nested: { drop: 'me' },
      fn: () => 1,
      arr: [1, 2],
    },
  });
  assert.deepEqual(msg.data, { a: 'x', n: 42, b: true }); // non-primitives dropped
});

test('sanitizeNotificationMessage caps the number of data keys', () => {
  const data: Record<string, number> = {};
  for (let i = 0; i < MAX_DATA_KEYS + 10; i += 1) {
    data[`k${i}`] = i;
  }
  const msg = sanitizeNotificationMessage({ title: 'T', body: 'B', data });
  assert.equal(Object.keys(msg.data ?? {}).length, MAX_DATA_KEYS);
});

test('describeNotificationForLog returns lengths/counts ONLY (no content)', () => {
  const msg = sanitizeNotificationMessage({
    title: 'Secret title',
    body: 'token=abc body',
    data: { k: 'v' },
  });
  const safe = describeNotificationForLog(msg);
  assert.deepEqual(safe, { titleLength: 12, bodyLength: 14, dataKeyCount: 1 });
  const serialised = JSON.stringify(safe);
  assert.ok(!serialised.includes('Secret'));
  assert.ok(!serialised.includes('token=abc'));
});

test('delivery-state guards', () => {
  assert.equal(isNotificationDeliveryState('scheduled'), true);
  assert.equal(isNotificationDeliveryState('nope'), false);
  assert.equal(isTerminalDeliveryState('delivered'), true);
  assert.equal(isTerminalDeliveryState('cancelled'), true);
  assert.equal(isTerminalDeliveryState('scheduled'), false);
});

test('normalizeTrigger defaults to immediate and clamps delays', () => {
  assert.deepEqual(normalizeTrigger(undefined), { type: 'immediate' });
  assert.deepEqual(normalizeTrigger({ type: 'delay', seconds: -5 }), { type: 'delay', seconds: 0 });
  assert.deepEqual(normalizeTrigger({ type: 'delay', seconds: 12.9 }), { type: 'delay', seconds: 12 });
  assert.deepEqual(normalizeTrigger({ type: 'date', timestamp: 1700000000000 }), {
    type: 'date',
    timestamp: 1700000000000,
  });
  assert.deepEqual(normalizeTrigger({ type: 'bogus' }), { type: 'immediate' });
});
