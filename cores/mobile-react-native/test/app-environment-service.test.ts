/**
 * App-environment service + placeholder adapter (RN 22 — app environment) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createLogger, type LogRecord } from '../src/logger/logger';
import { createAppEnvironmentService } from '../src/app-environment/service';
import { createPlaceholderAppEnvironmentAdapter } from '../src/app-environment/placeholder-adapter';
import type { AppEnvironmentAdapter } from '../src/app-environment';

test('getSnapshot returns a frozen sanitised snapshot from the adapter', () => {
  const adapter = createPlaceholderAppEnvironmentAdapter({
    os: 'ios',
    osVersion: '17.5.1',
    appVersion: '1.4.0',
    buildChannel: 'production',
    environment: 'production',
  });
  const service = createAppEnvironmentService({ adapter });
  const snapshot = service.getSnapshot();
  assert.equal(snapshot.os, 'ios');
  assert.equal(snapshot.osVersionMajor, 17);
  assert.equal(snapshot.appVersion, '1.4.0');
  assert.ok(Object.isFrozen(snapshot));
});

test('placeholder strips identifiers even when seeded with them (defensive)', () => {
  const adapter = createPlaceholderAppEnvironmentAdapter();
  adapter.setSnapshot({ os: 'android', osVersion: '14', deviceId: 'XYZ', idfa: 'leak', model: 'Pixel 8 Pro' });
  const service = createAppEnvironmentService({ adapter });
  const serialised = JSON.stringify(service.getSnapshot());
  assert.ok(!serialised.includes('XYZ'));
  assert.ok(!serialised.includes('leak'));
  assert.ok(!serialised.includes('Pixel'));
});

test('describeForContext returns a frozen record of allow-listed fields only', () => {
  const adapter = createPlaceholderAppEnvironmentAdapter({
    os: 'web',
    osVersion: '120.1',
    appVersion: '2.0.0',
    buildNumber: '55',
    buildChannel: 'preview',
    locale: 'de-DE',
    environment: 'staging',
  });
  const service = createAppEnvironmentService({ adapter });
  const context = service.describeForContext();
  assert.deepEqual(
    { ...context },
    {
      os: 'web',
      osVersionMajor: 120,
      appVersion: '2.0.0',
      buildNumber: '55',
      buildChannel: 'preview',
      locale: 'de-DE',
      environment: 'staging',
    },
  );
  assert.ok(Object.isFrozen(context));
});

test('a failing adapter is best-effort: never throws, falls back to { os: unknown }', () => {
  const failing: AppEnvironmentAdapter = {
    getSnapshot: () => {
      throw new Error('native boom');
    },
  };
  const service = createAppEnvironmentService({ adapter: failing });
  assert.doesNotThrow(() => service.getSnapshot());
  assert.deepEqual({ ...service.getSnapshot() }, { os: 'unknown' });
  assert.deepEqual({ ...service.describeForContext() }, { os: 'unknown' });
});

test('the logger only ever sees coarse fields — never an identifier, version or locale', () => {
  const records: LogRecord[] = [];
  const logger = createLogger({ level: 'debug', sink: (r) => records.push(r), clock: () => 1 });
  const adapter = createPlaceholderAppEnvironmentAdapter({
    os: 'ios',
    osVersion: '17.5.1',
    appVersion: '1.4.0',
    buildChannel: 'production',
    environment: 'production',
    deviceId: 'SECRET-DEVICE-ID',
  });
  const service = createAppEnvironmentService({ adapter, logger });
  service.getSnapshot();

  const serialised = JSON.stringify(records);
  assert.ok(!serialised.includes('SECRET-DEVICE-ID'));
  assert.ok(!serialised.includes('1.4.0')); // appVersion not in the log view
  const allowed = new Set(['operation', 'os', 'osVersionMajor', 'buildChannel', 'environment']);
  for (const record of records) {
    for (const key of Object.keys(record.fields ?? {})) {
      assert.ok(allowed.has(key), `unexpected logged field: ${key}`);
    }
  }
});
