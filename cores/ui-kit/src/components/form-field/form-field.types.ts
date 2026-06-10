import type { HTMLAttributes, LabelHTMLAttributes } from 'react';

export type FormFieldProps = HTMLAttributes<HTMLDivElement>;

export interface FormFieldLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** Indicateur visuel « requis » (décoratif ; la source de vérité reste le champ — `required`). */
  required?: boolean;
}

export type FormFieldDescriptionProps = HTMLAttributes<HTMLParagraphElement>;
export type FormFieldErrorProps = HTMLAttributes<HTMLParagraphElement>;
