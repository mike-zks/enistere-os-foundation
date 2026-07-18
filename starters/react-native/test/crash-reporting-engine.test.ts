/**
 * Crash-reporter service + placeholder adapter (RN 19 — crash reporting) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createLogger, type LogRecord } from '../src/logger/logger';
import { createCrashReporterService } from '../src/crash-reporting/engine';
import { createPlaceholderCrashReporterAdapter } from '../src/crash-reporting/placeholder-adapter';
import type { CrashReporterAdapter } from '../src/crash-reporting';

test('captureError sanitises and forwards to the adapter (no secret reaches it)', () => {
  const adapter = createPlaceholderCrashReporterAdapter();
  const service = createCrashReporterService({ adapter });
  const error = new Error('failed for user@host.com via Bearer aaaaaaaaaa.bbbbbbbbbb.cccccc');
  error.stack = 'Error: x\n  at fetch (file:///data/user/0/app/secret.js:1:1)';
  service.captureError(error, { severity: 'fatal', source: 'unhandled', context: { screen: 'Pay' } });

  const [event] = adapter.getErrors();
  assert.ok(event);
  assert.equal(event.severity, 'fatal');
  assert.equal(event.source, 'unhandled');
  assert.ok(!event.message.includes('aaaaaaaaaa.bbbbbbbbbb.cccccc'));
  assert.ok(!event.message.includes('user@host.com'));
  assert.ok(event.stack && !event.stack.includes('/data/user/0/app/secret'));
  assert.equal(event.context.screen, 'Pay');
  const serialised = JSON.stringify(adapter.getErrors());
  assert.ok(!serialised.includes('aaaaaaaaaa.bbbbbbbbbb.cccccc'));
  assert.ok(!serialised.includes('user@host.com'));
});

test('captureMessage defaults to manual/info and sanitises the message', () => {
  const adapter = createPlaceholderCrashReporterAdapter();
  const service = createCrashReporterService({ adapter });
  service.captureMessage('checkpoint Authorization: Bearer abc.def.ghi');
  const [event] = adapter.getMessages();
  assert.equal(event.severity, 'info');
  assert.equal(event.source, 'manual');
  assert.ok(!event.message.includes('abc.def.ghi'));
  assert.ok(event.message.includes('[Redacted]'));
});

test('ambient setContext is merged, sanitised and forwarded; secrets masked', () => {
  const adapter = createPlaceholderCrashReporterAdapter();
  const service = createCrashReporterService({ adapter, context: { app: 'demo' } });
  service.setContext({ build: 42, sessionToken: 'leak' });
  assert.deepEqual({ ...adapter.getContext() }, { app: 'demo', build: 42, sessionToken: '[Redacted]' });

  service.captureError(new Error('boom'), { context: { screen: 'X' } });
  const [event] = adapter.getErrors();
  assert.equal(event.context.app, 'demo');
  assert.equal(event.context.build, 42);
  assert.equal(event.context.sessionToken, '[Redacted]');
  assert.equal(event.context.screen, 'X');
});

test('captureError / captureMessage NEVER throw on a failing (sync) adapter', () => {
  const adapter: CrashReporterAdapter = {
    captureError: () => {
      throw new Error('native boom');
    },
    captureMessage: () => {
      throw new Error('native boom');
    },
  };
  const service = createCrashReporterService({ adapter });
  assert.doesNotThrow(() => service.captureError(new Error('x')));
  assert.doesNotThrow(() => service.captureMessage('y'));
});

test('an async-rejecting adapter is swallowed (no false success, no unhandled rejection)', async () => {
  const records: LogRecord[] = [];
  const logger = createLogger({ level: 'debug', sink: (r) => records.push(r), clock: () => 1 });
  const adapter: CrashReporterAdapter = {
    captureError: () => Promise.reject(new Error('network down: token=abc')),
    captureMessage: () => Promise.resolve(),
  };
  const service = createCrashReporterService({ adapter, logger });
  assert.doesNotThrow(() => service.captureError(new Error('x')));
  // let the rejected microtask settle
  await Promise.resolve();
  await Promise.resolve();
  const warn = records.find((r) => r.level === 'warn');
  assert.equal(warn?.fields?.operation, 'captureError');
  // no 'crash reported' (debug success) for the failed capture
  assert.equal(records.some((r) => r.level === 'debug' && r.fields?.operation === 'captureError'), false);
  assert.ok(!JSON.stringify(records).includes('token=abc'));
});

test('flush is best-effort: resolves on success, never rejects on failure', async () => {
  const ok = createPlaceholderCrashReporterAdapter();
  const okService = createCrashReporterService({ adapter: ok });
  await okService.flush();
  assert.equal(ok.flushCount, 1);

  const failing: CrashReporterAdapter = {
    captureError: () => undefined,
    captureMessage: () => undefined,
    flush: () => Promise.reject(new Error('boom')),
  };
  const failService = createCrashReporterService({ adapter: failing });
  await assert.doesNotReject(failService.flush());
});

test('the logger only ever sees {operation,severity,source} — never sensitive content', () => {
  const records: LogRecord[] = [];
  const logger = createLogger({ level: 'debug', sink: (r) => records.push(r), clock: () => 1 });
  const adapter = createPlaceholderCrashReporterAdapter();
  const service = createCrashReporterService({ adapter, logger });
  service.captureError(new Error('token=supersecret user@host.com'), {
    severity: 'error',
    source: 'caught',
    context: { refreshToken: 'leak', screen: 'Home' },
  });
  service.captureMessage('msg with Bearer abc.def.ghi');

  const serialised = JSON.stringify(records);
  assert.ok(!serialised.includes('supersecret'));
  assert.ok(!serialised.includes('user@host.com'));
  assert.ok(!serialised.includes('abc.def.ghi'));
  const allowed = new Set(['operation', 'severity', 'source']);
  for (const record of records) {
    for (const key of Object.keys(record.fields ?? {})) {
      assert.ok(allowed.has(key), `unexpected logged field: ${key}`);
    }
  }
});

test('placeholder returns defensive copies (mutating a returned event/array is harmless)', () => {
  const adapter = createPlaceholderCrashReporterAdapter();
  const service = createCrashReporterService({ adapter });
  service.captureError(new Error('boom'), { context: { a: 1 } });

  const first = adapter.getErrors();
  first.push(createTestSpyEvent());
  // mutating the returned array did not grow the internal store
  assert.equal(adapter.getErrors().length, 1);
  // returned events are frozen
  assert.ok(Object.isFrozen(adapter.getErrors()[0]));
});

function createTestSpyEvent() {
  // a throwaway sanitized event used only to attempt to pollute the store
  return Object.freeze({
    severity: 'info' as const,
    source: 'manual' as const,
    name: 'X',
    message: 'x',
    context: Object.freeze({}),
  });
}
