/**
 * Notification service + placeholder adapter (RN 10) — `node --test`.
 *
 * Covers the permission gate (no schedule without a usable permission), the
 * schedule/cancel flows, controlled adapter errors, and the guarantee that NO
 * notification content (title/body/data) is ever logged.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createLogger, type LogRecord } from '../src/logger/logger';
import {
  NotificationError,
  createNotificationService,
} from '../src/notifications/engine';
import { createPlaceholderNotificationAdapter } from '../src/notifications/placeholder-adapter';
import type { NotificationAdapter } from '../src/notifications/types';

const MESSAGE = { title: 'Hi', body: 'token=secret-xyz body', data: { secret: 'secret-xyz' } };

test('blocked permission -> no schedule (adapter.scheduleLocal never called)', async () => {
  let scheduleCalls = 0;
  const adapter: NotificationAdapter = {
    getPermissionStatus: async () => 'blocked',
    requestPermission: async () => 'blocked',
    scheduleLocal: async () => {
      scheduleCalls += 1;
      return 'x';
    },
    cancel: async () => {},
    cancelAll: async () => {},
  };
  const service = createNotificationService({ adapter });
  const result = await service.schedule({ message: { title: 'T', body: 'B' } });
  assert.equal(result.state, 'blocked');
  assert.equal(result.state === 'blocked' && result.status, 'blocked');
  assert.equal(scheduleCalls, 0);
});

test('denied permission that re-prompts to denied -> still blocked, no schedule', async () => {
  let scheduleCalls = 0;
  const adapter: NotificationAdapter = {
    getPermissionStatus: async () => 'denied',
    requestPermission: async () => 'denied',
    scheduleLocal: async () => {
      scheduleCalls += 1;
      return 'x';
    },
    cancel: async () => {},
    cancelAll: async () => {},
  };
  const result = await createNotificationService({ adapter }).schedule({
    message: { title: 'T', body: 'B' },
  });
  assert.equal(result.state, 'blocked');
  assert.equal(scheduleCalls, 0);
});

test('granted permission -> scheduled with an id', async () => {
  const adapter = createPlaceholderNotificationAdapter({ permission: 'granted' });
  const service = createNotificationService({ adapter });
  const result = await service.schedule({ message: { title: 'T', body: 'B' } });
  assert.equal(result.state, 'scheduled');
  assert.equal(result.state === 'scheduled' && result.id, 'local-1');
  assert.equal((await service.getDelivered()).length, 1);
});

test('limited permission is usable -> scheduled', async () => {
  const adapter = createPlaceholderNotificationAdapter({ permission: 'limited' });
  const result = await createNotificationService({ adapter }).schedule({
    message: { title: 'T', body: 'B' },
  });
  assert.equal(result.state, 'scheduled');
});

test('unknown permission is requested then granted -> scheduled', async () => {
  const adapter = createPlaceholderNotificationAdapter({ permission: 'unknown' }); // request grants
  const result = await createNotificationService({ adapter }).schedule({
    message: { title: 'T', body: 'B' },
  });
  assert.equal(result.state, 'scheduled');
});

test('cancel and cancelAll remove scheduled notifications', async () => {
  const adapter = createPlaceholderNotificationAdapter({ permission: 'granted' });
  const service = createNotificationService({ adapter });
  const a = await service.schedule({ message: { title: 'A', body: 'B' } });
  await service.schedule({ message: { title: 'C', body: 'D' } });
  assert.equal((await service.getDelivered()).length, 2);
  await service.cancel(a.state === 'scheduled' ? a.id : '');
  assert.equal((await service.getDelivered()).length, 1);
  await service.cancelAll();
  assert.equal((await service.getDelivered()).length, 0);
});

test('adapter scheduleLocal failure -> controlled NotificationError (no raw cause)', async () => {
  const adapter: NotificationAdapter = {
    getPermissionStatus: async () => 'granted',
    requestPermission: async () => 'granted',
    scheduleLocal: async () => {
      throw new Error('native boom token=secret-xyz');
    },
    cancel: async () => {},
    cancelAll: async () => {},
  };
  const service = createNotificationService({ adapter });
  await assert.rejects(service.schedule({ message: { title: 'T', body: 'B' } }), (err: unknown) => {
    assert.ok(err instanceof NotificationError);
    assert.equal(err.operation, 'schedule');
    assert.ok(!err.message.includes('secret-xyz'));
    return true;
  });
});

test('getDelivered is a safe no-op ([]) when the adapter lacks it', async () => {
  const adapter: NotificationAdapter = {
    getPermissionStatus: async () => 'granted',
    requestPermission: async () => 'granted',
    scheduleLocal: async () => 'id-1',
    cancel: async () => {},
    cancelAll: async () => {},
  };
  assert.deepEqual(await createNotificationService({ adapter }).getDelivered(), []);
});

test('NEVER logs notification content (title/body/data) — only safe fields', async () => {
  const records: LogRecord[] = [];
  const logger = createLogger({
    level: 'debug',
    sink: (record) => records.push(record),
    clock: () => 1_700_000_000_000,
  });
  const adapter = createPlaceholderNotificationAdapter({ permission: 'granted' });
  const service = createNotificationService({ adapter, logger });

  const scheduled = await service.schedule({ message: MESSAGE });
  await service.cancel(scheduled.state === 'scheduled' ? scheduled.id : '');
  await service.getDelivered();

  const serialised = JSON.stringify(records);
  assert.ok(!serialised.includes('secret-xyz'), 'no message content/token in logs');
  assert.ok(!serialised.includes('token='), 'no message body in logs');
  const allowedKeys = new Set(['id', 'status', 'state', 'count', 'kind']);
  for (const record of records) {
    for (const key of Object.keys(record.fields ?? {})) {
      assert.ok(allowedKeys.has(key), `unexpected logged field: ${key}`);
    }
  }
});
