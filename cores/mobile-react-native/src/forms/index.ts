/**
 * Forms & validation (RN 3).
 *
 * Generic, token-driven form primitives (React Hook Form + Zod) and the
 * agnostic helpers behind them. UX validation only — the API Core remains the
 * validation authority (ADR-003 §18). No business forms or DTO schemas here.
 */
export {
  validateWith,
  requiredText,
  minLengthText,
  maxLengthText,
  emailField,
  requiredCheckbox,
} from './validation';
export type { ValidationResult } from './validation';

export {
  zodErrorToFieldErrors,
  hasFieldErrors,
  getFieldError,
  firstFieldError,
  fieldErrorMessage,
  ROOT_ERROR_KEY,
} from './form-errors';
export type { FieldError, FieldErrorMap } from './form-errors';

export { FormField } from './FormField';
export type { FormFieldProps } from './FormField';
export { FormLabel } from './FormLabel';
export type { FormLabelProps } from './FormLabel';
export { FormError } from './FormError';
export type { FormErrorProps } from './FormError';
export { TextInputField } from './TextInputField';
export type { TextInputFieldProps } from './TextInputField';

export { zodResolver, createZodResolver } from './resolver';
