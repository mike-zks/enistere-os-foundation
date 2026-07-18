/**
 * Crash-event model + sanitization (RN 19 — crash reporting) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  MAX_CONTEXT_KEYS,
  MAX_MESSAGE_LENGTH,
  MAX_STACK_FRAMES,
  cloneCrashReportEvent,
  createCrashReportEvent,
  describeCrashEventForLog,
  isCrashSeverity,
  isCrashSource,
  normalizeCrashSeverity,
  normalizeCrashSource,
  sanitizeCrashContext,
  sanitizeCrashMessage,
  sanitizeCrashStack,
} from '../src/crash-reporting/event';

test('normalizeCrashSeverity folds aliases, junk → error', () => {
  assert.equal(normalizeCrashSeverity('fatal'), 'fatal');
  assert.equal(normalizeCrashSeverity('WARN'), 'warning');
  assert.equal(normalizeCrashSeverity('critical'), 'fatal');
  for (const junk of [null, undefined, 42, {}, 'weird']) {
    assert.equal(normalizeCrashSeverity(junk), 'error', String(junk));
  }
});

test('normalizeCrashSource folds aliases, junk → unknown', () => {
  assert.equal(normalizeCrashSource('uncaught'), 'unhandled');
  assert.equal(normalizeCrashSource('promise'), 'unhandledRejection');
  assert.equal(normalizeCrashSource('handled'), 'caught');
  for (const junk of [null, undefined, 1, 'nope']) {
    assert.equal(normalizeCrashSource(junk), 'unknown', String(junk));
  }
  assert.equal(isCrashSeverity('info'), true);
  assert.equal(isCrashSeverity('crash'), false);
  assert.equal(isCrashSource('manual'), true);
  assert.equal(isCrashSource('promise'), false);
});

test('sanitizeCrashMessage redacts secrets and bounds length', () => {
  assert.equal(sanitizeCrashMessage('plain failure'), 'plain failure');
  assert.ok(!sanitizeCrashMessage('login failed for user a@b.com').includes('a@b.com'));
  assert.ok(sanitizeCrashMessage('Bearer abcdef.ghijkl.mnopqr token leak').includes('[Redacted]'));
  assert.equal(sanitizeCrashMessage('x'.repeat(MAX_MESSAGE_LENGTH + 50)).length, MAX_MESSAGE_LENGTH);
  for (const junk of [null, undefined, 42, {}]) {
    assert.equal(sanitizeCrashMessage(junk), '', String(junk));
  }
});

test('sanitizeCrashStack scrubs device paths/tokens and caps frames; junk → undefined', () => {
  const raw = [
    'Error: boom',
    '    at Object.<anonymous> (file:///data/user/0/com.app/secret/app.js:1:1)',
    '    at fetch (https://api.example.com/d?token=supersecret&X-Amz-Signature=abc:2:2)',
  ].join('\n');
  const stack = sanitizeCrashStack(raw);
  assert.ok(stack);
  assert.ok(!stack!.includes('/data/user/0/com.app/secret'));
  assert.ok(!stack!.includes('supersecret'));
  assert.ok(stack!.includes('[Redacted]'));

  const many = Array.from({ length: MAX_STACK_FRAMES + 20 }, (_, i) => `at frame${i}`).join('\n');
  assert.ok(sanitizeCrashStack(many)!.split('\n').length <= MAX_STACK_FRAMES);

  for (const junk of [null, undefined, 42, '', '   ']) {
    assert.equal(sanitizeCrashStack(junk), undefined, String(junk));
  }
});

test('sanitizeCrashContext: sensitive keys redacted, values scrubbed/bounded, capped, frozen', () => {
  const ctx = sanitizeCrashContext({
    screen: 'Checkout',
    attempt: 3,
    flagOn: true,
    accessToken: 'should-be-masked',
    email: 'user@host.com', // sensitive key → masked entirely
    note: 'contact me at user@host.com', // value scrubbed
    nested: { deep: 1 }, // non-primitive dropped
  });
  assert.equal(ctx.screen, 'Checkout');
  assert.equal(ctx.attempt, 3);
  assert.equal(ctx.flagOn, true);
  assert.equal(ctx.accessToken, '[Redacted]');
  assert.equal(ctx.email, '[Redacted]');
  assert.ok(!String(ctx.note).includes('user@host.com'));
  assert.equal('nested' in ctx, false);
  assert.ok(Object.isFrozen(ctx));

  // tolerant + capped
  for (const junk of [null, undefined, 42, 'str', []]) {
    assert.deepEqual({ ...sanitizeCrashContext(junk) }, {});
  }
  const big: Record<string, number> = {};
  for (let i = 0; i < MAX_CONTEXT_KEYS + 10; i += 1) {
    big[`k${i}`] = i;
  }
  assert.ok(Object.keys(sanitizeCrashContext(big)).length <= MAX_CONTEXT_KEYS);
});

test('createCrashReportEvent builds a frozen, sanitised event from an Error', () => {
  const error = new TypeError('auth failed for user@host.com via Bearer aaaaaaaaaa.bbbbbbbbbb.cccccc');
  error.stack = 'TypeError: x\n  at fetch (file:///data/user/0/app/x.js:1:1)';
  const event = createCrashReportEvent({
    error,
    severity: 'fatal',
    source: 'unhandled',
    context: { screen: 'Home', refreshToken: 'leak' },
  });
  assert.equal(event.severity, 'fatal');
  assert.equal(event.source, 'unhandled');
  assert.equal(event.name, 'TypeError');
  assert.ok(!event.message.includes('user@host.com')); // email PII scrubbed
  assert.ok(!event.message.includes('aaaaaaaaaa.bbbbbbbbbb.cccccc')); // Bearer/JWT scrubbed
  assert.ok(event.message.includes('[Redacted]'));
  assert.ok(event.stack && !event.stack.includes('/data/user/0/app')); // device path scrubbed
  assert.equal(event.context.screen, 'Home');
  assert.equal(event.context.refreshToken, '[Redacted]'); // sensitive key masked
  assert.ok(Object.isFrozen(event));
});

test('createCrashReportEvent tolerates junk input (never throws), sensible defaults', () => {
  for (const junk of [undefined, {}, { error: 42 }, { error: null }, { message: 99 }]) {
    const event = createCrashReportEvent(junk as Record<string, unknown>);
    assert.equal(event.severity, 'error');
    assert.equal(event.name, 'Error');
    assert.equal(typeof event.message, 'string');
    assert.ok(Object.isFrozen(event));
  }
  // string error → message, no stack
  const e = createCrashReportEvent({ error: 'raw string boom' });
  assert.equal(e.message, 'raw string boom');
  assert.equal(e.stack, undefined);
});

test('cloneCrashReportEvent returns a frozen defensive copy', () => {
  const event = createCrashReportEvent({ message: 'x', context: { a: 1 } });
  const copy = cloneCrashReportEvent(event);
  assert.notEqual(copy, event);
  assert.deepEqual({ ...copy.context }, { ...event.context });
  assert.ok(Object.isFrozen(copy));
  assert.ok(Object.isFrozen(copy.context));
});

test('describeCrashEventForLog exposes enums ONLY', () => {
  const event = createCrashReportEvent({
    message: 'secret token=abc',
    severity: 'warning',
    source: 'manual',
    context: { email: 'a@b.com' },
  });
  const desc = describeCrashEventForLog(event);
  assert.deepEqual(desc, { severity: 'warning', source: 'manual' });
  assert.deepEqual(Object.keys(desc), ['severity', 'source']);
});
