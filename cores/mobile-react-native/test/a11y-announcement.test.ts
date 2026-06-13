/**
 * a11y announcement model (RN 14 — accessibility) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  MAX_ANNOUNCEMENT_LENGTH,
  describeAnnouncementForLog,
  sanitizeAnnouncement,
} from '../src/a11y/announcement';

test('sanitizeAnnouncement bounds a string message (polite by default)', () => {
  const a = sanitizeAnnouncement('  Item   added  to cart ');
  assert.deepEqual(a, { message: 'Item added to cart', assertive: false });
});

test('sanitizeAnnouncement reads { message, assertive }', () => {
  assert.deepEqual(sanitizeAnnouncement({ message: 'Error', assertive: true }), {
    message: 'Error',
    assertive: true,
  });
  assert.deepEqual(sanitizeAnnouncement({ message: 'x', assertive: 'yes' }), {
    message: 'x',
    assertive: false, // only `true` enables assertive
  });
});

test('sanitizeAnnouncement caps length and tolerates invalid input', () => {
  assert.equal(sanitizeAnnouncement('y'.repeat(MAX_ANNOUNCEMENT_LENGTH + 50)).message.length, MAX_ANNOUNCEMENT_LENGTH);
  assert.deepEqual(sanitizeAnnouncement({ message: 99 }), { message: '', assertive: false });
  assert.deepEqual(sanitizeAnnouncement(''), { message: '', assertive: false });
});

test('describeAnnouncementForLog returns length + assertive ONLY (no raw text)', () => {
  const a = sanitizeAnnouncement({ message: 'token=secret-xyz visible', assertive: true });
  const safe = describeAnnouncementForLog(a);
  assert.deepEqual(safe, { length: a.message.length, assertive: true });
  assert.ok(!JSON.stringify(safe).includes('secret-xyz'));
  assert.ok(!JSON.stringify(safe).includes('token'));
});
