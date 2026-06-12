/**
 * Client-side validation helpers (RN 3 — forms & validation).
 *
 * Thin, GENERIC helpers over Zod (ADR-003 §18 authorises Zod for mobile UX
 * validation). They provide reusable building blocks and a uniform result
 * shape — they are NOT business schemas and NOT a copy of any API DTO.
 *
 * ⚠️ Client validation is for UX only. The API Core NestJS remains the
 * authority (ADR-003 §7/§18): every input is re-validated server-side, and
 * server validation errors must still be surfaced. Do not treat these schemas
 * as a security boundary, and do not put domain-specific (Kivvoo/RFashion/
 * Bailo/…) schemas here.
 *
 * Framework-agnostic (Zod only, no React/RN) → unit-testable under `node --test`.
 */
import { z, type ZodTypeAny } from 'zod';

import { zodErrorToFieldErrors, type FieldErrorMap } from './form-errors';

/** Result of {@link validateWith}: typed data on success, field errors on failure. */
export type ValidationResult<TData> =
  | { readonly success: true; readonly data: TData }
  | { readonly success: false; readonly errors: FieldErrorMap };

/**
 * Validates `value` against a Zod `schema`, returning either the parsed data or
 * a normalised {@link FieldErrorMap} — never throws. Use it to drive UI without
 * touching Zod's error internals at call sites.
 */
export function validateWith<TSchema extends ZodTypeAny>(
  schema: TSchema,
  value: unknown,
): ValidationResult<z.infer<TSchema>> {
  const result = schema.safeParse(value);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: zodErrorToFieldErrors(result.error) };
}

// --- Generic field-schema factories (UX building blocks, not business DTOs) ---

/** A trimmed, non-empty string. */
export function requiredText(message = 'This field is required.'): z.ZodString {
  return z.string().trim().min(1, message);
}

/** A trimmed string with a minimum length. */
export function minLengthText(min: number, message?: string): z.ZodString {
  return z.string().trim().min(min, message ?? `Must be at least ${min} characters.`);
}

/** A trimmed string with a maximum length. */
export function maxLengthText(max: number, message?: string): z.ZodString {
  return z.string().trim().max(max, message ?? `Must be at most ${max} characters.`);
}

/** A trimmed, syntactically valid email (UX hint only — backend is authoritative). */
export function emailField(message = 'Enter a valid email address.'): z.ZodString {
  return z.string().trim().min(1, message).email(message);
}

/** A boolean that must be `true` (e.g. a generic "accept terms" checkbox). */
export function requiredCheckbox(message = 'This must be checked.'): z.ZodLiteral<true> {
  return z.literal(true, { message });
}
