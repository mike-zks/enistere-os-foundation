/**
 * Form error mapping (RN 3) — `node --test` over the agnostic error layer.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { z, type ZodError } from 'zod';

import {
  zodErrorToFieldErrors,
  hasFieldErrors,
  getFieldError,
  firstFieldError,
  fieldErrorMessage,
  ROOT_ERROR_KEY,
  type FieldErrorMap,
} from '../src/forms/form-errors';

function errorFor(schema: z.ZodTypeAny, value: unknown): ZodError {
  const result = schema.safeParse(value);
  assert.equal(result.success, false);
  if (result.success) {
    throw new Error('expected a validation failure');
  }
  return result.error;
}

test('zodErrorToFieldErrors flattens nested paths', () => {
  const schema = z.object({
    name: z.string().min(1, 'Name required'),
    address: z.object({ city: z.string().min(1, 'City required') }),
  });
  const map = zodErrorToFieldErrors(errorFor(schema, { name: '', address: { city: '' } }));
  assert.equal(map.name?.message, 'Name required');
  assert.equal(map['address.city']?.message, 'City required');
});

test('the first issue per field wins; empty path maps to root', () => {
  // 'a' fails BOTH the min and the email check on the same (root) path.
  const schema = z.string().min(5, 'min-msg').email('email-msg');
  const map = zodErrorToFieldErrors(errorFor(schema, 'a'));
  assert.equal(map[ROOT_ERROR_KEY]?.message, 'min-msg');
  assert.equal(Object.keys(map).length, 1);
});

test('accessors: getFieldError / firstFieldError / hasFieldErrors', () => {
  const map: FieldErrorMap = {
    name: { message: 'Name required' },
    'address.city': { message: 'City required' },
  };
  assert.equal(getFieldError(map, 'name'), 'Name required');
  assert.equal(getFieldError(map, 'missing'), undefined);
  assert.equal(getFieldError(undefined, 'name'), undefined);
  assert.equal(firstFieldError(map), 'Name required');
  assert.equal(firstFieldError({}), undefined);
  assert.equal(hasFieldErrors(map), true);
  assert.equal(hasFieldErrors({}), false);
  assert.equal(hasFieldErrors(undefined), false);
});

test('fieldErrorMessage reads RHF-style errors structurally', () => {
  assert.equal(fieldErrorMessage({ message: 'bad' }), 'bad');
  assert.equal(fieldErrorMessage({ message: '' }), undefined);
  assert.equal(fieldErrorMessage({ message: 42 }), undefined);
  assert.equal(fieldErrorMessage({}), undefined);
  assert.equal(fieldErrorMessage(undefined), undefined);
  assert.equal(fieldErrorMessage(null), undefined);
});
