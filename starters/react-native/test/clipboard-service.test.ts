/**
 * Secure clipboard service + placeholder adapter (RN 23 — clipboard) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createLogger, type LogRecord } from '../src/logger/logger';
import { createClipboardService } from '../src/clipboard/service';
import { createPlaceholderClipboardAdapter } from '../src/clipboard/placeholder-adapter';
import type { ClipboardAdapter } from '../src/clipboard';

const SENSITIVE = 'Authorization: Bearer abcdefghij.klmnopqrst.uvwxyz';

test('copy of normal text succeeds and round-trips', async () => {
  const adapter = createPlaceholderClipboardAdapter();
  const clipboard = createClipboardService({ adapter });
  const result = await clipboard.copy('ABCD-1234');
  assert.deepEqual(result, { result: 'success', sensitivity: 'normal' });
  assert.equal(adapter.peek(), 'ABCD-1234');
  assert.equal(await clipboard.hasString(), true);
  assert.equal(await clipboard.getString(), 'ABCD-1234');
});

test('copy of sensitive text WITHOUT opt-in is rejected — adapter never called', async () => {
  let setCalls = 0;
  const adapter: ClipboardAdapter = {
    setString: () => {
      setCalls += 1;
      return Promise.resolve();
    },
  };
  const clipboard = createClipboardService({ adapter });
  const result = await clipboard.copy(SENSITIVE);
  assert.deepEqual(result, { result: 'rejected', sensitivity: 'sensitive' });
  assert.equal(setCalls, 0, 'sensitive text must not reach the adapter without opt-in');
});

test('copy of sensitive text WITH opt-in succeeds (and via markSensitive)', async () => {
  const adapter = createPlaceholderClipboardAdapter();
  const clipboard = createClipboardService({ adapter });
  assert.deepEqual(await clipboard.copy(SENSITIVE, { allowSensitive: true }), {
    result: 'success',
    sensitivity: 'sensitive',
  });
  // markSensitive forces sensitive even for innocuous text → rejected without opt-in
  assert.deepEqual(await clipboard.copy('plain', { markSensitive: true }), {
    result: 'rejected',
    sensitivity: 'sensitive',
  });
});

test('getString is explicit and NEVER logs the content (even when sensitive)', async () => {
  const records: LogRecord[] = [];
  const logger = createLogger({ level: 'debug', sink: (r) => records.push(r), clock: () => 1 });
  const adapter = createPlaceholderClipboardAdapter();
  await adapter.setString(SENSITIVE); // simulate an external sensitive value
  const clipboard = createClipboardService({ adapter, logger });
  const value = await clipboard.getString();
  assert.equal(value, SENSITIVE, 'the explicit caller still receives the value');
  const serialised = JSON.stringify(records);
  assert.ok(!serialised.includes('Bearer'));
  assert.ok(!serialised.includes('abcdefghij'));
});

test('clear works, and is a safe no-op when unsupported', async () => {
  const full = createPlaceholderClipboardAdapter();
  const withClear = createClipboardService({ adapter: full });
  await full.setString('x');
  await withClear.clear();
  assert.equal(full.peek(), undefined);

  const noClear: ClipboardAdapter = { setString: () => Promise.resolve() };
  const service = createClipboardService({ adapter: noClear });
  await assert.doesNotReject(service.clear());
  assert.equal(await service.getString(), undefined); // getString also unavailable → undefined
  assert.equal(await service.hasString(), false);
});

test('a throwing adapter yields a controlled error result, never throws', async () => {
  const adapter: ClipboardAdapter = {
    setString: () => Promise.reject(new Error('native boom')),
    getString: () => Promise.reject(new Error('native boom')),
  };
  const clipboard = createClipboardService({ adapter });
  assert.deepEqual(await clipboard.copy('safe'), { result: 'error', sensitivity: 'normal' });
  assert.equal(await clipboard.getString(), undefined);
});

test('logs carry only { operation, result, sensitivity, length } — never content', async () => {
  const records: LogRecord[] = [];
  const logger = createLogger({ level: 'debug', sink: (r) => records.push(r), clock: () => 1 });
  const adapter = createPlaceholderClipboardAdapter();
  const clipboard = createClipboardService({ adapter, logger });
  await clipboard.copy('SECRET-MARKER-12345'); // normal but recognisable token in content
  await clipboard.copy(SENSITIVE); // rejected
  await clipboard.getString();

  const serialised = JSON.stringify(records);
  assert.ok(!serialised.includes('SECRET-MARKER-12345'));
  assert.ok(!serialised.includes('Bearer'));
  const allowed = new Set(['operation', 'result', 'sensitivity', 'length']);
  for (const record of records) {
    for (const key of Object.keys(record.fields ?? {})) {
      assert.ok(allowed.has(key), `unexpected logged field: ${key}`);
    }
  }
});
