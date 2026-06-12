/**
 * Validation helpers (RN 3) — `node --test` over the agnostic Zod layer.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { z } from 'zod';

import {
  validateWith,
  requiredText,
  minLengthText,
  maxLengthText,
  emailField,
  requiredCheckbox,
} from '../src/forms/validation';

test('validateWith returns trimmed, typed data on success', () => {
  const schema = z.object({ name: requiredText(), email: emailField() });
  const result = validateWith(schema, { name: '  Ada  ', email: 'ada@example.com' });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.name, 'Ada');
    assert.equal(result.data.email, 'ada@example.com');
  }
});

test('validateWith returns a normalised field-error map on failure', () => {
  const schema = z.object({ name: requiredText(), email: emailField() });
  const result = validateWith(schema, { name: '', email: 'not-an-email' });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errors.name?.message, 'This field is required.');
    assert.ok(result.errors.email?.message);
  }
});

test('requiredText rejects whitespace-only input', () => {
  assert.equal(validateWith(requiredText(), '   ').success, false);
  assert.equal(validateWith(requiredText(), 'x').success, true);
});

test('minLengthText / maxLengthText enforce bounds', () => {
  assert.equal(validateWith(minLengthText(3), 'ab').success, false);
  assert.equal(validateWith(minLengthText(3), 'abc').success, true);
  assert.equal(validateWith(maxLengthText(3), 'abcd').success, false);
  assert.equal(validateWith(maxLengthText(3), 'abc').success, true);
});

test('emailField accepts a valid address and rejects an invalid one', () => {
  assert.equal(validateWith(emailField(), 'a@b.co').success, true);
  assert.equal(validateWith(emailField(), 'a@b').success, false);
  assert.equal(validateWith(emailField(), '').success, false);
});

test('requiredCheckbox requires a true value', () => {
  assert.equal(validateWith(requiredCheckbox(), true).success, true);
  assert.equal(validateWith(requiredCheckbox(), false).success, false);
});
