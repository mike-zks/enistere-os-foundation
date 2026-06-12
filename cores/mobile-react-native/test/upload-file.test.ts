/**
 * RN file primitives (RN 7 — secure upload) — `node --test` over the pure helpers.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { describeFileForLog, isAllowedFileType, isMobileFile } from '../src/upload/file';

const file = { uri: 'file:///tmp/IMG_0001.jpg', name: 'photo.jpg', type: 'image/jpeg' };

test('isMobileFile guards the {uri,name,type} shape', () => {
  assert.equal(isMobileFile(file), true);
  assert.equal(isMobileFile({ uri: '', name: 'x', type: 'y' }), false); // empty uri
  assert.equal(isMobileFile({ name: 'x', type: 'y' }), false); // no uri
  assert.equal(isMobileFile({ uri: 'u', name: 'n' }), false); // no type
  assert.equal(isMobileFile(null), false);
  assert.equal(isMobileFile('nope'), false);
});

test('describeFileForLog drops the uri (no device path / payload leak)', () => {
  const safe = describeFileForLog(file);
  assert.deepEqual(safe, { name: 'photo.jpg', type: 'image/jpeg' });
  assert.equal('uri' in safe, false);
});

test('isAllowedFileType: exact, wildcard subtype, */*, and empty = allow all', () => {
  assert.equal(isAllowedFileType(file, ['image/jpeg']), true);
  assert.equal(isAllowedFileType(file, ['image/png']), false);
  assert.equal(isAllowedFileType(file, ['image/*']), true);
  assert.equal(isAllowedFileType(file, ['*/*']), true);
  assert.equal(isAllowedFileType(file, []), true); // empty → defers to backend
  assert.equal(isAllowedFileType({ ...file, type: 'application/pdf' }, ['image/*']), false);
});
