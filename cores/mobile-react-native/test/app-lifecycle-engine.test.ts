/**
 * App-lifecycle service + placeholder adapter (RN 15) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createLogger, type LogRecord } from '../src/logger/logger';
import { createAppLifecycleService } from '../src/app-lifecycle/engine';
import { createPlaceholderAppLifecycleAdapter } from '../src/app-lifecycle/placeholder-adapter';
import type { AppLifecycleAdapter, AppLifecycleState } from '../src/app-lifecycle';

test('reads the initial state from the adapter', () => {
  const adapter = createPlaceholderAppLifecycleAdapter('active');
  assert.equal(createAppLifecycleService({ adapter }).getState(), 'active');
});

test('adapter-driven changes flow to the service and its subscribers', () => {
  const adapter = createPlaceholderAppLifecycleAdapter('active');
  const service = createAppLifecycleService({ adapter });
  const seen: AppLifecycleState[] = [];
  service.subscribe((s) => seen.push(s));
  adapter.setState('background');
  adapter.setState('active');
  assert.equal(service.getState(), 'active');
  assert.deepEqual(seen, ['background', 'active']);
});

test('transition validates: invalid (real -> unknown) is ignored', () => {
  const adapter = createPlaceholderAppLifecycleAdapter('active');
  const service = createAppLifecycleService({ adapter });
  assert.equal(service.transition('inactive'), 'inactive');
  assert.equal(service.transition('unknown'), 'inactive'); // ignored (kept)
  assert.equal(service.transition('garbage'), 'inactive'); // garbage -> unknown -> ignored
  assert.equal(service.transition('background'), 'background');
});

test('subscribe/unsubscribe is deterministic', () => {
  const adapter = createPlaceholderAppLifecycleAdapter('unknown');
  const service = createAppLifecycleService({ adapter });
  const seen: AppLifecycleState[] = [];
  const unsubscribe = service.subscribe((s) => seen.push(s));
  service.transition('active');
  unsubscribe();
  service.transition('background');
  assert.deepEqual(seen, ['active']); // no notification after unsubscribe
});

test('no notification when the state does not change', () => {
  const adapter = createPlaceholderAppLifecycleAdapter('active');
  const service = createAppLifecycleService({ adapter });
  let count = 0;
  service.subscribe(() => { count += 1; });
  service.transition('active'); // same -> no-op
  assert.equal(count, 0);
});

test('a throwing listener is isolated (others still notified)', () => {
  const adapter = createPlaceholderAppLifecycleAdapter('unknown');
  const service = createAppLifecycleService({ adapter });
  const seen: AppLifecycleState[] = [];
  service.subscribe(() => {
    throw new Error('boom');
  });
  service.subscribe((s) => seen.push(s));
  assert.doesNotThrow(() => service.transition('active'));
  assert.deepEqual(seen, ['active']);
});

test('controlled adapter errors: getState/subscribe failures never throw', () => {
  const adapter: AppLifecycleAdapter = {
    getState: () => {
      throw new Error('native boom');
    },
    subscribe: () => {
      throw new Error('native boom');
    },
  };
  let service: ReturnType<typeof createAppLifecycleService> | undefined;
  assert.doesNotThrow(() => {
    service = createAppLifecycleService({ adapter });
  });
  assert.equal(service?.getState(), 'unknown'); // safe default
  assert.equal(service?.transition('active'), 'active'); // still usable for manual transitions
});

test('dispose unsubscribes from the adapter and drops listeners', () => {
  const adapter = createPlaceholderAppLifecycleAdapter('active');
  const service = createAppLifecycleService({ adapter });
  const seen: AppLifecycleState[] = [];
  service.subscribe((s) => seen.push(s));
  service.dispose();
  adapter.setState('background'); // adapter no longer drives the service
  assert.equal(service.getState(), 'active');
  assert.deepEqual(seen, []);
});

test('logs only enum fields (from/to/operation) — no sensitive data', () => {
  const records: LogRecord[] = [];
  const logger = createLogger({
    level: 'debug',
    sink: (record) => records.push(record),
    clock: () => 1_700_000_000_000,
  });
  const adapter = createPlaceholderAppLifecycleAdapter('active');
  const service = createAppLifecycleService({ adapter, logger });
  service.transition('background');
  const debug = records.find((r) => r.level === 'debug');
  assert.deepEqual(debug?.fields, { from: 'active', to: 'background' });
  const allowedKeys = new Set(['from', 'to', 'operation']);
  for (const record of records) {
    for (const key of Object.keys(record.fields ?? {})) {
      assert.ok(allowedKeys.has(key), `unexpected logged field: ${key}`);
    }
  }
});
