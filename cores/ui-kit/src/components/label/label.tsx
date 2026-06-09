import { forwardRef } from 'react';

import { mergeClassNames } from '../../utilities/merge-class-names.js';
import type { LabelProps } from './label.types.js';

/** Label natif (`<label>`). `htmlFor` transmis. L'astérisque requis est décoratif (`aria-hidden`). */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { required = false, className, children, ...rest },
  ref,
) {
  return (
    <label ref={ref} className={mergeClassNames('enistere-label', className)} {...rest}>
      {children}
      {required ? (
        <span className="enistere-label__required" aria-hidden="true">
          {' *'}
        </span>
      ) : null}
    </label>
  );
});
