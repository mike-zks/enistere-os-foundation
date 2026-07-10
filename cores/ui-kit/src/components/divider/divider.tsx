import { forwardRef } from 'react';

import { mergeClassNames } from '../../utilities/merge-class-names.js';
import type { DividerProps } from './divider.types.js';

/**
 * Séparateur visuel entre sections. **Décoratif** (`aria-hidden="true"`) par défaut quand aucun
 * label n'est fourni ; **sémantique** (`role="separator"`) quand un label est présent.
 * Supporte les orientations `horizontal` et `vertical`.
 */
export const Divider = forwardRef<HTMLDivElement, DividerProps>(function Divider(
  { orientation = 'horizontal', label, className, ...rest },
  ref,
) {
  const isLabeled = label !== undefined && label !== null;

  if (isLabeled) {
    return (
      <div
        ref={ref}
        {...rest}
        role="separator"
        aria-orientation={orientation}
        className={mergeClassNames(
          'enistere-divider',
          `enistere-divider--${orientation}`,
          'enistere-divider--labeled',
          className,
        )}
      >
        <span className="enistere-divider__line" aria-hidden="true" />
        <span className="enistere-divider__label">{label}</span>
        <span className="enistere-divider__line" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      {...rest}
      aria-hidden="true"
      className={mergeClassNames('enistere-divider', `enistere-divider--${orientation}`, className)}
    />
  );
});
