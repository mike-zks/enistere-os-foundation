/**
 * Network connectivity service + placeholder adapter (RN 16) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createLogger, type LogRecord } from '../src/logger/logger';
import { createNetworkService } from '../src/offline/network-service';
import { createPlaceholderNetworkAdapter } from '../src/offline/placeholder-network-adapter';
import { shouldQueueMutations, type NetworkState } from '../src/offline/network-state';
import type { NetworkAdapter } from '../src/offline/network-adapter';

const clock = () => 1_700_000_000_000;

test('reads the initial reading from the adapter (with type)', () => {
  const adapter = createPlaceholderNetworkAdapter({ status: 'online', type: 'wifi' });
  const service = createNetworkService({ adapter, clock });
  assert.deepEqual(service.getStatus(), { status: 'online', changedAt: clock(), type: 'wifi' });
  assert.equal(service.shouldQueue(), false);
});

test('an unknown initial reading keeps changedAt null (RN 3 initial shape)', () => {
  const adapter = createPlaceholderNetworkAdapter('unknown');
  const service = createNetworkService({ adapter, clock });
  assert.deepEqual(service.getStatus(), { status: 'unknown', changedAt: null, type: 'unknown' });
  assert.equal(service.shouldQueue(), true); // conservative
});

test('shouldQueueMutations(service.getStatus()) stays canonical', () => {
  const adapter = createPlaceholderNetworkAdapter('offline');
  const service = createNetworkService({ adapter, clock });
  assert.equal(shouldQueueMutations(service.getStatus()), true);
  service.transition({ status: 'online', type: 'cellular' });
  assert.equal(shouldQueueMutations(service.getStatus()), false);
});

test('adapter-driven changes flow to the service and subscribers; changedAt on status change', () => {
  const adapter = createPlaceholderNetworkAdapter('offline');
  const service = createNetworkService({ adapter, clock });
  const seen: NetworkState[] = [];
  service.subscribe((s) => seen.push(s));
  adapter.setStatus({ status: 'online', type: 'wifi' });
  assert.equal(service.getStatus().status, 'online');
  assert.equal(service.getStatus().changedAt, clock()); // stamped on status change
  assert.deepEqual(seen.map((s) => s.status), ['online']);
});

test('a type-only change keeps changedAt but still notifies', () => {
  const adapter = createPlaceholderNetworkAdapter({ status: 'online', type: 'wifi' });
  const service = createNetworkService({ adapter, clock: () => 111 });
  const seen: NetworkState[] = [];
  service.subscribe((s) => seen.push(s));
  service.transition({ status: 'online', type: 'cellular' }); // same status, new type
  assert.deepEqual(service.getStatus(), { status: 'online', changedAt: 111, type: 'cellular' });
  assert.equal(seen.length, 1);
});

test('no notification when nothing changes', () => {
  const adapter = createPlaceholderNetworkAdapter({ status: 'online', type: 'wifi' });
  const service = createNetworkService({ adapter, clock });
  let count = 0;
  service.subscribe(() => { count += 1; });
  service.transition({ status: 'online', type: 'wifi' });
  assert.equal(count, 0);
});

test('subscribe/unsubscribe is deterministic', () => {
  const adapter = createPlaceholderNetworkAdapter('unknown');
  const service = createNetworkService({ adapter, clock });
  const seen: string[] = [];
  const unsubscribe = service.subscribe((s) => seen.push(s.status));
  service.transition('online');
  unsubscribe();
  service.transition('offline');
  assert.deepEqual(seen, ['online']);
});

test('a throwing listener is isolated', () => {
  const adapter = createPlaceholderNetworkAdapter('unknown');
  const service = createNetworkService({ adapter, clock });
  const seen: string[] = [];
  service.subscribe(() => {
    throw new Error('boom');
  });
  service.subscribe((s) => seen.push(s.status));
  assert.doesNotThrow(() => service.transition('online'));
  assert.deepEqual(seen, ['online']);
});

test('controlled adapter errors: getStatus/subscribe failures never throw', () => {
  const adapter: NetworkAdapter = {
    getStatus: () => {
      throw new Error('native boom');
    },
    subscribe: () => {
      throw new Error('native boom');
    },
  };
  let service: ReturnType<typeof createNetworkService> | undefined;
  assert.doesNotThrow(() => {
    service = createNetworkService({ adapter, clock });
  });
  assert.equal(service?.getStatus().status, 'unknown'); // safe default
  assert.equal(service?.transition('online').status, 'online'); // still usable
});

test('dispose unsubscribes from the adapter and drops listeners', () => {
  const adapter = createPlaceholderNetworkAdapter('online');
  const service = createNetworkService({ adapter, clock });
  const seen: string[] = [];
  service.subscribe((s) => seen.push(s.status));
  service.dispose();
  adapter.setStatus('offline');
  assert.equal(service.getStatus().status, 'online');
  assert.deepEqual(seen, []);
});

test('logs only enum metadata (from/to/type/operation) — no sensitive data', () => {
  const records: LogRecord[] = [];
  const logger = createLogger({
    level: 'debug',
    sink: (record) => records.push(record),
    clock,
  });
  const adapter = createPlaceholderNetworkAdapter('offline');
  const service = createNetworkService({ adapter, logger, clock });
  service.transition({ status: 'online', type: 'wifi' });
  const debug = records.find((r) => r.level === 'debug');
  assert.deepEqual(debug?.fields, { from: 'offline', to: 'online', type: 'wifi' });
  const allowedKeys = new Set(['from', 'to', 'type', 'operation']);
  for (const record of records) {
    for (const key of Object.keys(record.fields ?? {})) {
      assert.ok(allowedKeys.has(key), `unexpected logged field: ${key}`);
    }
  }
});
