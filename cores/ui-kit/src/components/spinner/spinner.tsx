import { forwardRef } from 'react';

import { mergeClassNames } from '../../utilities/merge-class-names.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import type { SpinnerProps } from './spinner.types.js';

/** Indicateur de progression indéterminée. Autonome (`role="status"` + libellé) ou décoratif. */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = 'md', label = 'Chargement…', decorative = false, className, ...rest },
  ref,
) {
  const a11y = decorative ? { 'aria-hidden': true } : { role: 'status' };
  return (
    <span
      ref={ref}
      className={mergeClassNames('enistere-spinner', `enistere-spinner--${size}`, className)}
      {...a11y}
      {...rest}
    >
      <span className="enistere-spinner__indicator" aria-hidden="true" />
      {decorative ? null : <VisuallyHidden>{label}</VisuallyHidden>}
    </span>
  );
});
