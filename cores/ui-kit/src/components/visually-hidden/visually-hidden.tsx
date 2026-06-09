import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

import { mergeClassNames } from '../../utilities/merge-class-names.js';

export type VisuallyHiddenProps = HTMLAttributes<HTMLSpanElement>;

/** Masque visuellement le contenu tout en le gardant accessible aux technologies d'assistance. */
export const VisuallyHidden = forwardRef<HTMLSpanElement, VisuallyHiddenProps>(function VisuallyHidden(
  { className, children, ...rest },
  ref,
) {
  return (
    <span ref={ref} className={mergeClassNames('enistere-visually-hidden', className)} {...rest}>
      {children}
    </span>
  );
});
