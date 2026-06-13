/**
 * a11y service + placeholder adapter (RN 14 — accessibility) — `node --test`.
 *
 * Covers announce/focus/isScreenReaderEnabled, controlled (non-throwing) adapter
 * errors, and the guarantee that the logger never receives raw announcement text.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createLogger, type LogRecord } from '../src/logger/logger';
import { A11yAdapterError, type A11yAdapter } from '../src/a11y/adapter';
import { createA11yService } from '../src/a11y/engine';
import { createPlaceholderA11yAdapter } from '../src/a11y/placeholder-adapter';

test('announce records a sanitised announcement in the adapter', () => {
  const adapter = createPlaceholderA11yAdapter();
  const service = createA11yService({ adapter });
  service.announce('  Saved  ');
  service.announce({ message: 'Error happened', assertive: true });
  const announcements = adapter.getAnnouncements();
  assert.equal(announcements.length, 2);
  assert.deepEqual(announcements[0], { message: 'Saved', assertive: false });
  assert.deepEqual(announcements[1], { message: 'Error happened', assertive: true });
});

test('announce ignores an empty message (nothing to speak)', () => {
  const adapter = createPlaceholderA11yAdapter();
  createA11yService({ adapter }).announce('   ');
  assert.equal(adapter.getAnnouncements().length, 0);
});

test('focus records the target; isScreenReaderEnabled reflects the adapter', async () => {
  const adapter = createPlaceholderA11yAdapter({ screenReaderEnabled: true });
  const service = createA11yService({ adapter });
  service.focus({ id: 'email-field' });
  assert.deepEqual(adapter.getFocusTargets(), [{ id: 'email-field' }]);
  assert.equal(await service.isScreenReaderEnabled(), true);
});

test('focus / isScreenReaderEnabled are safe no-ops when unsupported', async () => {
  const adapter: A11yAdapter = { announce: () => {} }; // no focus / no isScreenReaderEnabled
  const service = createA11yService({ adapter });
  assert.doesNotThrow(() => service.focus({ id: 'x' }));
  assert.equal(await service.isScreenReaderEnabled(), false);
});

test('adapter errors are controlled — announce/focus never throw, log a safe warn', () => {
  const records: LogRecord[] = [];
  const logger = createLogger({
    level: 'debug',
    sink: (record) => records.push(record),
    clock: () => 1_700_000_000_000,
  });
  const adapter: A11yAdapter = {
    announce: () => {
      throw new Error('native boom secret-xyz');
    },
    focus: () => {
      throw new Error('native boom secret-xyz');
    },
  };
  const service = createA11yService({ adapter, logger });
  assert.doesNotThrow(() => service.announce('hello'));
  assert.doesNotThrow(() => service.focus({ id: 'x' }));
  const warns = records.filter((r) => r.level === 'warn');
  assert.equal(warns.length, 2);
  assert.deepEqual(warns[0]?.fields, { operation: 'announce' });
  assert.deepEqual(warns[1]?.fields, { operation: 'focus' });
  assert.ok(!JSON.stringify(records).includes('secret-xyz'));
});

test('isScreenReaderEnabled returns false (safe default) on adapter error', async () => {
  const adapter: A11yAdapter = {
    announce: () => {},
    isScreenReaderEnabled: async () => {
      throw new Error('boom');
    },
  };
  assert.equal(await createA11yService({ adapter }).isScreenReaderEnabled(), false);
});

test('the logger NEVER receives the raw announcement text — only {length, assertive}', () => {
  const records: LogRecord[] = [];
  const logger = createLogger({
    level: 'debug',
    sink: (record) => records.push(record),
    clock: () => 1_700_000_000_000,
  });
  const service = createA11yService({ adapter: createPlaceholderA11yAdapter(), logger });
  service.announce({ message: 'token=secret-xyz for jane@example.com', assertive: true });

  const serialised = JSON.stringify(records);
  assert.ok(!serialised.includes('secret-xyz'));
  assert.ok(!serialised.includes('jane@example.com'));
  const allowedKeys = new Set(['length', 'assertive', 'operation']);
  for (const record of records) {
    for (const key of Object.keys(record.fields ?? {})) {
      assert.ok(allowedKeys.has(key), `unexpected logged field: ${key}`);
    }
  }
});

test('A11yAdapterError carries only the operation, no sensitive cause', () => {
  const err = new A11yAdapterError('announce');
  assert.equal(err.name, 'A11yAdapterError');
  assert.equal(err.operation, 'announce');
  assert.ok(!err.message.toLowerCase().includes('secret'));
});
