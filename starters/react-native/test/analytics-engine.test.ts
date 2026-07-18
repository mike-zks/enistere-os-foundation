/**
 * Analytics service + placeholder adapter (RN 13) — `node --test`.
 *
 * Covers tracking, sanitisation before the adapter, best-effort (non-throwing)
 * error handling, and the guarantee that the logger only sees safe fields.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createLogger, type LogRecord } from '../src/logger/logger';
import { createAnalyticsService } from '../src/analytics/engine';
import { createPlaceholderAnalyticsAdapter } from '../src/analytics/placeholder-adapter';
import type { AnalyticsAdapter } from '../src/analytics/adapter';

test('track records a sanitised event in the adapter', () => {
  const adapter = createPlaceholderAnalyticsAdapter();
  const service = createAnalyticsService({ adapter });
  service.track('screen_view', { screen: 'home', token: 'secret-xyz', count: 2 });
  const events = adapter.getEvents();
  assert.equal(events.length, 1);
  assert.equal(events[0]?.name, 'screen_view');
  assert.deepEqual(events[0]?.properties, { screen: 'home', count: 2 }); // token dropped
  assert.ok(!JSON.stringify(events).includes('secret-xyz'));
});

test('the adapter NEVER receives a sensitive value', () => {
  const adapter = createPlaceholderAnalyticsAdapter();
  const service = createAnalyticsService({ adapter });
  service.track('login', {
    access_token: 'abc',
    Authorization: 'Bearer secret-xyz',
    deep: 'open myapp://x?signature=zzz',
    email: 'a@b.com',
    method: 'oauth',
  });
  const serialised = JSON.stringify(adapter.getEvents());
  assert.ok(!serialised.includes('secret-xyz'));
  assert.ok(!serialised.includes('abc"')); // access_token dropped
  assert.ok(!serialised.includes('a@b.com'));
  assert.ok(serialised.includes('oauth')); // safe value kept
});

test('adapter failure is controlled — track never throws, logs a safe warn', () => {
  const records: LogRecord[] = [];
  const logger = createLogger({
    level: 'debug',
    sink: (record) => records.push(record),
    clock: () => 1_700_000_000_000,
  });
  const adapter: AnalyticsAdapter = {
    track: () => {
      throw new Error('native boom token=secret-xyz');
    },
  };
  const service = createAnalyticsService({ adapter, logger });
  assert.doesNotThrow(() => service.track('e', { a: 1 }));
  const warn = records.find((r) => r.level === 'warn');
  assert.ok(warn);
  assert.deepEqual(warn?.fields, { eventName: 'e' });
  assert.ok(!JSON.stringify(records).includes('secret-xyz'));
});

test('logger ONLY receives safe fields (eventName/propertyCount), never values', () => {
  const records: LogRecord[] = [];
  const logger = createLogger({
    level: 'debug',
    sink: (record) => records.push(record),
    clock: () => 1_700_000_000_000,
  });
  const service = createAnalyticsService({
    adapter: createPlaceholderAnalyticsAdapter(),
    logger,
  });
  service.track('purchase', { sku: 'ABC', token: 'secret-xyz', email: 'a@b.com', amount: 9 });

  const serialised = JSON.stringify(records);
  assert.ok(!serialised.includes('secret-xyz'));
  assert.ok(!serialised.includes('a@b.com'));
  assert.ok(!serialised.includes('ABC')); // even non-sensitive VALUES are not logged
  const allowedKeys = new Set(['eventName', 'propertyCount']);
  for (const record of records) {
    for (const key of Object.keys(record.fields ?? {})) {
      assert.ok(allowedKeys.has(key), `unexpected logged field: ${key}`);
    }
  }
});

test('flush delegates when supported and is a safe no-op otherwise', async () => {
  let flushed = 0;
  const withFlush: AnalyticsAdapter = { track: () => {}, flush: async () => { flushed += 1; } };
  await createAnalyticsService({ adapter: withFlush }).flush();
  assert.equal(flushed, 1);

  const noFlush: AnalyticsAdapter = { track: () => {} };
  await assert.doesNotReject(createAnalyticsService({ adapter: noFlush }).flush());
});

test('flush failure is controlled — never throws', async () => {
  const adapter: AnalyticsAdapter = {
    track: () => {},
    flush: async () => {
      throw new Error('flush boom token=secret-xyz');
    },
  };
  await assert.doesNotReject(createAnalyticsService({ adapter }).flush());
});

test('track never throws on invalid input', () => {
  const service = createAnalyticsService({ adapter: createPlaceholderAnalyticsAdapter() });
  assert.doesNotThrow(() => service.track('', undefined));
  assert.doesNotThrow(() => service.track('e', null as unknown as Record<string, unknown>));
});
