import { forwardRef } from 'react';

import { mergeClassNames } from '../../utilities/merge-class-names.js';
import type { InputProps } from './input.types.js';

/** Champ de saisie natif. `forwardRef`, `aria-invalid` si invalide. Aucune logique de formulaire. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = 'md', invalid = false, type, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type ?? 'text'}
      aria-invalid={invalid || undefined}
      className={mergeClassNames(
        'enistere-input',
        `enistere-input--${size}`,
        invalid && 'enistere-input--invalid',
        className,
      )}
      {...rest}
    />
  );
});
