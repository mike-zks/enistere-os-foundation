import { forwardRef, type ReactElement } from 'react';

import { mergeClassNames } from '../../utilities/merge-class-names.js';
import { Label } from '../label/label.js';
import type {
  FormFieldDescriptionProps,
  FormFieldErrorProps,
  FormFieldLabelProps,
  FormFieldProps,
} from './form-field.types.js';

/**
 * Association **explicite** label / champ / aide / erreur — **sans injection magique** dans les enfants.
 * Le consommateur câble lui-même `htmlFor` / `id` / `aria-describedby` / `aria-invalid` (composition
 * lisible, pas un moteur de formulaire). N'impose ni état ni validation.
 *
 * @example
 * <FormField>
 *   <FormFieldLabel htmlFor="email" required>E-mail</FormFieldLabel>
 *   <Input id="email" aria-describedby="email-help email-error" aria-invalid={hasError} />
 *   <FormFieldDescription id="email-help">…</FormFieldDescription>
 *   <FormFieldError id="email-error">…</FormFieldError>
 * </FormField>
 */
export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(function FormField(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={mergeClassNames('enistere-form-field', className)} {...rest} />;
});

/** Label du champ — réutilise la primitive `Label` (indicateur `required` décoratif). */
export function FormFieldLabel({ className, ...rest }: FormFieldLabelProps): ReactElement {
  return <Label className={mergeClassNames('enistere-form-field__label', className)} {...rest} />;
}

/** Texte d'aide. Le consommateur lui donne un `id` référencé par `aria-describedby` du champ. */
export function FormFieldDescription({ className, ...rest }: FormFieldDescriptionProps): ReactElement {
  return <p className={mergeClassNames('enistere-form-field__description', className)} {...rest} />;
}

/** Message d'erreur. Le consommateur lui donne un `id` référencé par `aria-describedby` du champ. */
export function FormFieldError({ className, ...rest }: FormFieldErrorProps): ReactElement {
  return <p className={mergeClassNames('enistere-form-field__error', className)} {...rest} />;
}
