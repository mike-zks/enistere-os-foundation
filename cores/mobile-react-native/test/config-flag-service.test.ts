/**
 * Feature-flag service + placeholder adapter (RN 17 — feature flags) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createLogger, type LogRecord } from '../src/logger/logger';
import { createFlagService } from '../src/config/flag-service';
import { createPlaceholderFlagAdapter } from '../src/config/placeholder-flag-adapter';
import type { FlagAdapter, FlagSet } from '../src/config';

test('resolves adapter flags over base defaults', () => {
  const adapter = createPlaceholderFlagAdapter({ 'feature.a': true });
  const service = createFlagService({
    adapter,
    defaults: { 'feature.a': false, 'feature.b': 'base' },
  });
  assert.equal(service.getFlag('feature.a', false), true); // adapter overrides default
  assert.equal(service.getFlag('feature.b', 'x'), 'base'); // from defaults
  assert.equal(service.getFlag('feature.missing', 42), 42); // unknown -> default
  assert.deepEqual(service.getAll(), { 'feature.a': true, 'feature.b': 'base' });
});

test('getFlag returns safe defaults on type mismatch', () => {
  const adapter = createPlaceholderFlagAdapter({ 'feature.n': 'not-a-number' });
  const service = createFlagService({ adapter });
  assert.equal(service.getFlag('feature.n', 10), 10); // string flag, number default -> default
  assert.equal(service.getFlag('feature.n', 'fallback'), 'not-a-number'); // matching type
});

test('adapter-driven changes update the service and notify subscribers', () => {
  const adapter = createPlaceholderFlagAdapter({ 'feature.x': false });
  const service = createFlagService({ adapter });
  const seen: FlagSet[] = [];
  service.subscribe((f) => seen.push(f));
  adapter.setFlags({ 'feature.x': true, 'feature.y': 'on' });
  assert.equal(service.getFlag('feature.x', false), true);
  assert.equal(seen.length, 1);
  assert.deepEqual(seen[0], { 'feature.x': true, 'feature.y': 'on' });
});

test('subscriber mutations do not corrupt the service state', () => {
  const adapter = createPlaceholderFlagAdapter({ a: true });
  const service = createFlagService({ adapter });
  service.subscribe((flags) => {
    (flags as Record<string, unknown>).a = false;
    (flags as Record<string, unknown>).extra = 'mutated';
  });
  adapter.setFlags({ a: true });
  assert.deepEqual(service.getAll(), { a: true });
});

test('subscribe/unsubscribe is deterministic', () => {
  const adapter = createPlaceholderFlagAdapter({});
  const service = createFlagService({ adapter });
  let count = 0;
  const unsubscribe = service.subscribe(() => { count += 1; });
  adapter.setFlags({ a: 1 });
  unsubscribe();
  adapter.setFlags({ a: 2 });
  assert.equal(count, 1);
});

test('a throwing listener is isolated', () => {
  const adapter = createPlaceholderFlagAdapter({});
  const service = createFlagService({ adapter });
  const seen: FlagSet[] = [];
  service.subscribe(() => {
    throw new Error('boom');
  });
  service.subscribe((f) => seen.push(f));
  assert.doesNotThrow(() => adapter.setFlags({ a: true }));
  assert.deepEqual(seen, [{ a: true }]);
});

test('refresh is best-effort: applies a fresh set, never throws on failure', async () => {
  const adapter = createPlaceholderFlagAdapter({ a: false });
  const service = createFlagService({ adapter });
  adapter.setFlags({ a: true }); // refresh() returns the adapter's current set
  await service.refresh();
  assert.equal(service.getFlag('a', false), true);

  const failing: FlagAdapter = {
    getFlags: () => ({ a: true }),
    refresh: async () => {
      throw new Error('boom');
    },
  };
  const s2 = createFlagService({ adapter: failing });
  await assert.doesNotReject(s2.refresh());
  assert.equal(s2.getFlag('a', false), true); // kept
});

test('controlled adapter errors: getFlags failure falls back to defaults, never throws', () => {
  const adapter: FlagAdapter = {
    getFlags: () => {
      throw new Error('native boom');
    },
  };
  let service: ReturnType<typeof createFlagService> | undefined;
  assert.doesNotThrow(() => {
    service = createFlagService({ adapter, defaults: { 'feature.a': true } });
  });
  assert.equal(service?.getFlag('feature.a', false), true); // from defaults
});

test('dispose unsubscribes from the adapter and drops listeners', () => {
  const adapter = createPlaceholderFlagAdapter({});
  const service = createFlagService({ adapter });
  const seen: FlagSet[] = [];
  service.subscribe((f) => seen.push(f));
  service.dispose();
  adapter.setFlags({ a: true });
  assert.deepEqual(seen, []);
});

test('the logger only ever sees a { count } — never flag keys or values', () => {
  const records: LogRecord[] = [];
  const logger = createLogger({
    level: 'debug',
    sink: (record) => records.push(record),
    clock: () => 1_700_000_000_000,
  });
  const adapter = createPlaceholderFlagAdapter({});
  const service = createFlagService({ adapter, logger });
  adapter.setFlags({ 'feature.secret': 'secret-xyz', n: 2 });

  const serialised = JSON.stringify(records);
  assert.ok(!serialised.includes('secret-xyz'));
  assert.ok(!serialised.includes('feature.secret'));
  const debug = records.find((r) => r.level === 'debug');
  assert.deepEqual(debug?.fields, { count: 2 });
  const allowedKeys = new Set(['count', 'operation']);
  for (const record of records) {
    for (const key of Object.keys(record.fields ?? {})) {
      assert.ok(allowedKeys.has(key), `unexpected logged field: ${key}`);
    }
  }
});

test('tolerates invalid inputs (defaults + adapter flags)', () => {
  const adapter = createPlaceholderFlagAdapter('garbage'); // -> {}
  const service = createFlagService({ adapter, defaults: 99 as unknown as Record<string, unknown> });
  assert.deepEqual(service.getAll(), {});
  assert.equal(service.getFlag('x', true), true);
});
