/**
 * Standardised form field errors (RN 3 — forms & validation).
 *
 * A normalised, UI-friendly representation of validation errors that is
 * independent of the producer. It bridges two sources:
 * - **Zod** — {@link zodErrorToFieldErrors} flattens a `ZodError` by path.
 * - **React Hook Form** — {@link fieldErrorMessage} reads RHF's per-field
 *   `{ message }` structurally (no `react-hook-form` import → stays agnostic).
 *
 * Framework-agnostic (no React/RN runtime imports; the `ZodError` import is
 * type-only) → unit-testable under `node --test`.
 *
 * NOTE (ADR-003 §18): client validation is UX only. The API Core remains the
 * validation authority; these messages must never leak sensitive detail.
 */
import type { ZodError } from 'zod';

/** A single, display-ready field error. */
export interface FieldError {
  readonly message: string;
}

/** Field name → its (first) error. Field names mirror the form's value keys. */
export type FieldErrorMap = Readonly<Record<string, FieldError>>;

/** Key used for form-level (non field-specific) errors. */
export const ROOT_ERROR_KEY = 'root';

/**
 * Flattens a `ZodError` into a {@link FieldErrorMap}. Nested paths are joined
 * with `.` (e.g. `address.city`); empty paths map to {@link ROOT_ERROR_KEY}.
 * The FIRST issue per field wins (later issues for the same field are ignored),
 * so the message shown is stable and not clobbered by secondary checks.
 */
export function zodErrorToFieldErrors(error: ZodError): FieldErrorMap {
  const map: Record<string, FieldError> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : ROOT_ERROR_KEY;
    if (map[key] === undefined) {
      map[key] = { message: issue.message };
    }
  }
  return map;
}

/** True when the map holds at least one error. */
export function hasFieldErrors(errors: FieldErrorMap | undefined): boolean {
  return errors !== undefined && Object.keys(errors).length > 0;
}

/** Returns the message for `name`, or `undefined` when there is none. */
export function getFieldError(errors: FieldErrorMap | undefined, name: string): string | undefined {
  return errors?.[name]?.message;
}

/**
 * Returns the first error message (insertion order), or `undefined`. Handy for
 * summarising a form's validity in a single line.
 */
export function firstFieldError(errors: FieldErrorMap | undefined): string | undefined {
  if (!errors) {
    return undefined;
  }
  for (const key of Object.keys(errors)) {
    const entry = errors[key];
    if (entry) {
      return entry.message;
    }
  }
  return undefined;
}

/**
 * Structurally extracts a message from a React Hook Form field error
 * (`{ message?: unknown }`) without importing `react-hook-form`. Returns a
 * non-empty string message, or `undefined`.
 */
export function fieldErrorMessage(error: { message?: unknown } | undefined | null): string | undefined {
  const message = error?.message;
  return typeof message === 'string' && message.length > 0 ? message : undefined;
}
