/**
 * Central redaction (RN 8 — logger / observability) — `node --test`.
 *
 * The security core of the logger: proves tokens, Authorization, cookies, signed
 * URLs, device paths and PII never survive redaction.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  REDACTED,
  isSensitiveKey,
  redactString,
  redactValue,
} from '../src/logger/redaction';

test('isSensitiveKey matches case/format variants but not look-alikes', () => {
  for (const key of [
    'authorization',
    'Authorization',
    'access_token',
    'Access-Token',
    'refreshToken',
    'API_KEY',
    'set-cookie',
    'password',
    'signedUrl',
    'email',
  ]) {
    assert.equal(isSensitiveKey(key), true, key);
  }
  for (const key of ['author', 'monkey', 'tokenCount', 'description', 'id', 'status']) {
    assert.equal(isSensitiveKey(key), false, key);
  }
});

test('redactValue masks sensitive keys, keeps the rest, never mutates input', () => {
  const input = {
    userId: 'u-123',
    accessToken: 'eyJabc.eyJdef.sig',
    nested: { refreshToken: 'r-secret', cookie: 'a=b', keepMe: 42 },
    Authorization: 'Bearer xyz',
    apiKey: 'k-1',
  };
  const out = redactValue(input) as Record<string, any>;
  assert.equal(out.userId, 'u-123');
  assert.equal(out.accessToken, REDACTED);
  assert.equal(out.Authorization, REDACTED);
  assert.equal(out.apiKey, REDACTED);
  assert.equal(out.nested.refreshToken, REDACTED);
  assert.equal(out.nested.cookie, REDACTED);
  assert.equal(out.nested.keepMe, 42);
  // input untouched
  assert.equal(input.accessToken, 'eyJabc.eyJdef.sig');
});

test('redactValue walks arrays and tolerates cycles', () => {
  const cyclic: any = { name: 'x', token: 'secret' };
  cyclic.self = cyclic;
  const out = redactValue([{ password: 'p' }, cyclic]) as any[];
  assert.equal(out[0].password, REDACTED);
  assert.equal(out[1].token, REDACTED);
  assert.equal(out[1].self, '[Circular]');
});

test('redactValue serialises Error as name + redacted message, no stack', () => {
  const err = new TypeError('failed for token Bearer abc.def.ghijklmnop');
  const out = redactValue(err) as Record<string, unknown>;
  assert.equal(out.name, 'TypeError');
  assert.equal('stack' in out, false);
  assert.ok(!String(out.message).includes('abc.def.ghijklmnop'));
});

test('redactString masks Bearer/Basic credentials but keeps the scheme', () => {
  assert.equal(redactString('Authorization: Bearer abcDEF.123-_x'), `Authorization: Bearer ${REDACTED}`);
  assert.match(redactString('Basic dXNlcjpwYXNz'), /^Basic \[Redacted\]$/);
});

test('redactString masks bare JWTs', () => {
  const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJ';
  const out = redactString(`token=${jwt} done`);
  assert.ok(!out.includes(jwt));
  assert.match(out, /done$/);
});

test('redactString masks device file paths, keeps scheme', () => {
  assert.equal(
    redactString('upload from file:///var/mobile/Containers/Data/IMG_0001.jpg'),
    `upload from file://${REDACTED}`,
  );
  assert.equal(redactString('content://media/external/images/42'), `content://${REDACTED}`);
});

test('redactString masks signed-URL query params, keeps the param name', () => {
  const url =
    'https://s3.example.com/bucket/key?X-Amz-Signature=deadbeef&X-Amz-Credential=AKIA/x&response=ok';
  const out = redactString(url);
  assert.ok(!out.includes('deadbeef'));
  assert.ok(!out.includes('AKIA/x'));
  assert.match(out, /X-Amz-Signature=\[Redacted\]/);
  assert.match(out, /X-Amz-Credential=\[Redacted\]/);
  assert.match(out, /response=ok/); // non-sensitive param preserved
});

test('redactString masks obvious emails (PII)', () => {
  assert.equal(redactString('user jane.doe@example.com signed in'), `user ${REDACTED} signed in`);
});

test('redactString leaves ordinary text and look-alikes intact', () => {
  assert.equal(redactString('uploaded photo.jpg (image/jpeg) v1.2.3'), 'uploaded photo.jpg (image/jpeg) v1.2.3');
});

test('redactValue caps recursion depth without throwing', () => {
  let deep: any = 'leaf';
  for (let i = 0; i < 40; i += 1) {
    deep = { next: deep };
  }
  assert.doesNotThrow(() => redactValue(deep));
});
