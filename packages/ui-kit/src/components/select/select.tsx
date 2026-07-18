import { forwardRef } from 'react';

import { mergeClassNames } from '../../utilities/merge-class-names.js';
import type { SelectProps } from './select.types.js';

/**
 * Champ de sélection natif (`<select>`) accessible, piloté par les tokens.
 *
 * Le `ref` pointe vers l'élément `<select>` interne. `className` / `style` ciblent le
 * wrapper `<span>` (mise en page). Les options sont passées en `children` (`<option>` /
 * `<optgroup>`) — pas d'injection automatique.
 *
 * @example
 * <FormField>
 *   <FormFieldLabel htmlFor="country" required>Pays</FormFieldLabel>
 *   <Select id="country" value={value} onChange={handleChange} invalid={hasError}>
 *     <option value="">— choisir —</option>
 *     <option value="ci">Côte d'Ivoire</option>
 *     <option value="sn">Sénégal</option>
 *   </Select>
 *   <FormFieldError id="country-error">Champ requis</FormFieldError>
 * </FormField>
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { size = 'md', invalid = false, className, style, children, ...rest },
  ref,
) {
  return (
    <span
      className={mergeClassNames('enistere-select-wrapper', `enistere-select-wrapper--${size}`, className)}
      style={style}
    >
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={mergeClassNames('enistere-select', `enistere-select--${size}`, invalid && 'enistere-select--invalid')}
        {...rest}
      >
        {children}
      </select>
    </span>
  );
});
