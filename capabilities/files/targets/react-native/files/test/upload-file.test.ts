/**
 * RN file primitives (RN 7 — secure upload) — `node --test` over the pure helpers.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { describeFileForLog, isAllowedFileType, isMobileFile } from '../src/features/upload/file';

const file = { uri: 'file:///tmp/IMG_0001.jpg', name: 'photo.jpg', type: 'image/jpeg' };

test('isMobileFile guards the {uri,name,type} shape', () => {
  assert.equal(isMobileFile(file), true);
  assert.equal(isMobileFile({ uri: '', name: 'x', type: 'y' }), false); // empty uri
  assert.equal(isMobileFile({ name: 'x', type: 'y' }), false); // no uri
  assert.equal(isMobileFile({ uri: 'u', name: 'n' }), false); // no type
  assert.equal(isMobileFile(null), false);
  assert.equal(isMobileFile('nope'), false);
});

test('describeFileForLog drops the uri AND the raw name (no device path / PII leak)', () => {
  const safe = describeFileForLog(file);
  assert.deepEqual(safe, { type: 'image/jpeg', extension: 'jpg' });
  assert.equal('uri' in safe, false);
  assert.equal('name' in safe, false);
  // A PII-bearing filename never survives — only the safe extension does.
  const pii = describeFileForLog({ ...file, name: 'john_doe_passport_2026.PNG' });
  assert.deepEqual(pii, { type: 'image/jpeg', extension: 'png' });
  // No / weird extension → null (still never the raw name).
  assert.deepEqual(describeFileForLog({ ...file, name: 'noext' }), {
    type: 'image/jpeg',
    extension: null,
  });
});

test('isAllowedFileType: exact, wildcard subtype, */*, and empty = allow all', () => {
  assert.equal(isAllowedFileType(file, ['image/jpeg']), true);
  assert.equal(isAllowedFileType(file, ['image/png']), false);
  assert.equal(isAllowedFileType(file, ['image/*']), true);
  assert.equal(isAllowedFileType(file, ['*/*']), true);
  assert.equal(isAllowedFileType(file, []), true); // empty → defers to backend
  assert.equal(isAllowedFileType({ ...file, type: 'application/pdf' }, ['image/*']), false);
});
