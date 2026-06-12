/**
 * Generic typed logger (RN 8 — logger / observability) — `node --test`.
 *
 * Exercises level filtering, injected clock/sink, central redaction at the
 * logger boundary, and `context`/`requestId` correlation.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { REDACTED } from '../src/logger/redaction';
import { createLogger, isLevelEnabled, type LogRecord } from '../src/logger/logger';
import { safeErrorFields } from '../src/logger/error-fields';

/** A capturing sink + a fixed clock for deterministic assertions. */
function harness(level?: 'debug' | 'info' | 'warn' | 'error') {
  const records: LogRecord[] = [];
  const logger = createLogger({
    level,
    sink: (record) => records.push(record),
    clock: () => 1_700_000_000_000,
  });
  return { logger, records };
}

test('isLevelEnabled respects the threshold ordering', () => {
  assert.equal(isLevelEnabled('info', 'debug'), false);
  assert.equal(isLevelEnabled('info', 'info'), true);
  assert.equal(isLevelEnabled('info', 'error'), true);
  assert.equal(isLevelEnabled('debug', 'debug'), true);
  assert.equal(isLevelEnabled('error', 'warn'), false);
});

test('emits a structured record with the injected clock', () => {
  const { logger, records } = harness('debug');
  logger.info('hello', { a: 1 });
  assert.equal(records.length, 1);
  assert.equal(records[0].level, 'info');
  assert.equal(records[0].message, 'hello');
  assert.equal(records[0].timestamp, 1_700_000_000_000);
  assert.deepEqual(records[0].fields, { a: 1 });
});

test('drops records below the configured level', () => {
  const { logger, records } = harness('warn');
  logger.debug('d');
  logger.info('i');
  logger.warn('w');
  logger.error('e');
  assert.deepEqual(
    records.map((r) => r.level),
    ['warn', 'error'],
  );
});

test('redacts sensitive fields and message at the logger boundary', () => {
  const { logger, records } = harness('debug');
  logger.error('request failed: Bearer abc.def.ghijklmnop', {
    accessToken: 'secret',
    nested: { cookie: 'a=b' },
    safe: 'ok',
  });
  const [record] = records;
  assert.match(record.message, /Bearer \[Redacted\]$/);
  assert.equal(record.fields?.accessToken, REDACTED);
  assert.equal((record.fields?.nested as Record<string, unknown>).cookie, REDACTED);
  assert.equal(record.fields?.safe, 'ok');
});

test('child() nests context and merges base fields; withRequestId() correlates', () => {
  const { logger, records } = harness('debug');
  const child = logger.child('upload', { feature: 'files' });
  child.withRequestId('req-42').info('uploading');
  const [record] = records;
  assert.equal(record.context, 'upload');
  assert.equal(record.requestId, 'req-42');
  assert.deepEqual(record.fields, { feature: 'files' });
});

test('omits empty fields and absent context/requestId', () => {
  const { logger, records } = harness('debug');
  logger.info('bare');
  const [record] = records;
  assert.equal('fields' in record, false);
  assert.equal('context' in record, false);
  assert.equal('requestId' in record, false);
});

test('safeErrorFields keeps correlation, drops message/payload', () => {
  const fields = safeErrorFields({
    kind: 'http',
    status: 413,
    errorCode: 'FILE_TOO_LARGE',
    requestId: 'rid-9',
    isUnauthorized: false,
    isForbidden: false,
    isNotFound: false,
    message: 'That file is too large.',
  });
  assert.deepEqual(fields, {
    kind: 'http',
    status: 413,
    errorCode: 'FILE_TOO_LARGE',
    requestId: 'rid-9',
  });
  assert.equal('message' in fields, false);
});
