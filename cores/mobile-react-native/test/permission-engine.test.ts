/**
 * Permission service + placeholder adapter (RN 9) — `node --test`.
 *
 * Covers status reads, request allowed/refused, the `ensure` flow, adapter
 * errors (controlled rethrow), and the security guarantee that NO sensitive data
 * is logged (only `{ kind, status }` enum fields via the RN 8 logger).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createLogger, type LogRecord } from '../src/logger/logger';
import {
  PermissionAdapterError,
  createPermissionService,
} from '../src/permissions/engine';
import { createPlaceholderPermissionAdapter } from '../src/permissions/placeholder-adapter';
import type { PermissionAdapter } from '../src/permissions/adapter';

test('getStatus reads the live status (placeholder)', async () => {
  const adapter = createPlaceholderPermissionAdapter({ initial: { camera: 'denied' } });
  const service = createPermissionService({ adapter });
  assert.equal(await service.getStatus('camera'), 'denied');
  assert.equal(await service.getStatus('notifications'), 'unknown');
});

test('request allowed: unknown/denied -> granted', async () => {
  const adapter = createPlaceholderPermissionAdapter({ initial: { camera: 'denied' } });
  const service = createPermissionService({ adapter });
  assert.equal(await service.request('camera'), 'granted');
  assert.equal(await service.getStatus('camera'), 'granted'); // persisted in the sim
});

test('request refused: onRequest can deny', async () => {
  const adapter = createPlaceholderPermissionAdapter({ onRequest: () => 'denied' });
  const service = createPermissionService({ adapter });
  assert.equal(await service.request('mediaLibrary'), 'denied');
});

test('ensure does not re-prompt when already granted, prompts when grantable', async () => {
  let prompts = 0;
  const adapter: PermissionAdapter = {
    getStatus: async () => 'denied',
    request: async () => {
      prompts += 1;
      return 'granted';
    },
  };
  const service = createPermissionService({ adapter });
  assert.equal(await service.ensure('camera'), 'granted');
  assert.equal(prompts, 1);

  const grantedAdapter: PermissionAdapter = {
    getStatus: async () => 'granted',
    request: async () => {
      throw new Error('should not be called');
    },
  };
  assert.equal(await createPermissionService({ adapter: grantedAdapter }).ensure('camera'), 'granted');
});

test('ensure returns blocked/unavailable without prompting', async () => {
  for (const status of ['blocked', 'unavailable'] as const) {
    let prompts = 0;
    const adapter: PermissionAdapter = {
      getStatus: async () => status,
      request: async () => {
        prompts += 1;
        return 'granted';
      },
    };
    assert.equal(await createPermissionService({ adapter }).ensure('camera'), status);
    assert.equal(prompts, 0);
  }
});

test('adapter error -> controlled PermissionAdapterError, no raw cause leaked', async () => {
  const adapter: PermissionAdapter = {
    getStatus: async () => {
      throw new Error('native boom: token=secret-abc');
    },
    request: async () => {
      throw new Error('native boom: token=secret-abc');
    },
  };
  const service = createPermissionService({ adapter });
  await assert.rejects(service.getStatus('camera'), (err: unknown) => {
    assert.ok(err instanceof PermissionAdapterError);
    assert.equal(err.kind, 'camera');
    assert.equal(err.operation, 'getStatus');
    assert.ok(!err.message.includes('secret-abc')); // raw cause never surfaced
    return true;
  });
  await assert.rejects(service.request('camera'), PermissionAdapterError);
});

test('openSettings: delegates when present, safe no-op warn when unsupported', async () => {
  let opened = 0;
  const withSettings: PermissionAdapter = {
    getStatus: async () => 'unknown',
    request: async () => 'granted',
    openSettings: async () => {
      opened += 1;
    },
  };
  await createPermissionService({ adapter: withSettings }).openSettings();
  assert.equal(opened, 1);

  // Adapter WITHOUT openSettings → resolves (no throw) and warns safely.
  const records: LogRecord[] = [];
  const logger = createLogger({
    level: 'debug',
    sink: (record) => records.push(record),
    clock: () => 1_700_000_000_000,
  });
  const noSettings: PermissionAdapter = {
    getStatus: async () => 'unknown',
    request: async () => 'granted',
  };
  await createPermissionService({ adapter: noSettings, logger }).openSettings();
  const warn = records.find((r) => r.level === 'warn');
  assert.ok(warn);
  assert.equal('fields' in warn, false); // message-only, no fields
});

test('logs ONLY safe { kind, status } fields — no sensitive data', async () => {
  const records: LogRecord[] = [];
  const logger = createLogger({
    level: 'debug',
    sink: (record) => records.push(record),
    clock: () => 1_700_000_000_000,
  });
  // Adapter returns a raw object carrying a token-like field; the engine must
  // normalise to an enum and never log the raw payload.
  const adapter: PermissionAdapter = {
    getStatus: async () => ({ status: 'granted', accessToken: 'secret-xyz' }) as never,
    request: async () => ({ status: 'denied', authorization: 'Bearer secret-xyz' }) as never,
    openSettings: async () => {},
  };
  const service = createPermissionService({ adapter, logger });
  await service.getStatus('camera');
  await service.request('notifications');

  assert.ok(records.length >= 2);
  const allowedKeys = new Set(['kind', 'status']);
  const serialised = JSON.stringify(records);
  assert.ok(!serialised.includes('secret-xyz'), 'no token value in any log record');
  assert.ok(!serialised.includes('accessToken'), 'no sensitive key in any log record');
  for (const record of records) {
    for (const key of Object.keys(record.fields ?? {})) {
      assert.ok(allowedKeys.has(key), `unexpected logged field: ${key}`);
    }
  }
});

test('adapter-failure log carries only { kind } (no error payload)', async () => {
  const records: LogRecord[] = [];
  const logger = createLogger({
    level: 'debug',
    sink: (record) => records.push(record),
    clock: () => 1_700_000_000_000,
  });
  const adapter: PermissionAdapter = {
    getStatus: async () => {
      throw new Error('native boom token=secret-abc');
    },
    request: async () => 'granted',
  };
  await assert.rejects(createPermissionService({ adapter, logger }).getStatus('camera'));
  const warn = records.find((r) => r.level === 'warn');
  assert.ok(warn);
  assert.deepEqual(warn?.fields, { kind: 'camera' });
  assert.ok(!JSON.stringify(records).includes('secret-abc'));
});
