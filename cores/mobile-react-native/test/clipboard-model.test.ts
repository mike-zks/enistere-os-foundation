/**
 * Secure clipboard model + sensitivity (RN 23 — clipboard) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  MAX_CLIPBOARD_TEXT_LENGTH,
  classifyClipboardSensitivity,
  describeClipboardResultForLog,
  describeClipboardTextForLog,
  isSensitiveClipboardText,
  normalizeClipboardText,
} from '../src/clipboard/model';

test('normalizeClipboardText coerces + bounds (non-string → empty)', () => {
  assert.equal(normalizeClipboardText('hello'), 'hello');
  assert.equal(normalizeClipboardText('x'.repeat(MAX_CLIPBOARD_TEXT_LENGTH + 100)).length, MAX_CLIPBOARD_TEXT_LENGTH);
  for (const junk of [null, undefined, 42, {}, []]) {
    assert.equal(normalizeClipboardText(junk), '', String(junk));
  }
});

test('isSensitiveClipboardText flags secret-shaped text (Bearer/JWT/email/signed URL/URI)', () => {
  for (const text of [
    'Authorization: Bearer abcdefghij.klmnopqrst.uvwxyz',
    'aaaaaaaaaa.bbbbbbbbbb.cccccc', // JWT-shaped
    'ping me at user@host.com',
    'https://x.io/d?token=zzz&X-Amz-Signature=abc',
    'file:///data/user/0/app/secret.png',
    'content://media/external/images/42',
  ]) {
    assert.equal(isSensitiveClipboardText(text), true, text);
    assert.equal(classifyClipboardSensitivity(text), 'sensitive', text);
  }
  for (const text of ['ABCD-1234', 'https://example.com/help', 'hello world', '']) {
    assert.equal(isSensitiveClipboardText(text), false, text);
    assert.equal(classifyClipboardSensitivity(text), 'normal', text);
  }
});

test('describeClipboardTextForLog exposes length + sensitivity ONLY (never content)', () => {
  const desc = describeClipboardTextForLog('Bearer abcdefghij.klmnopqrst.uvwxyz');
  assert.equal(desc.sensitivity, 'sensitive');
  assert.equal(typeof desc.length, 'number');
  assert.deepEqual(Object.keys(desc).sort(), ['length', 'sensitivity']);
  // no content fields
  assert.ok(!JSON.stringify(desc).includes('Bearer'));
  assert.ok(!JSON.stringify(desc).includes('abcdefghij'));

  assert.deepEqual(describeClipboardResultForLog('rejected'), { result: 'rejected' });
});
