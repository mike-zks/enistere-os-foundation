import { createElement, forwardRef } from 'react';

import { mergeClassNames } from '../../utilities/merge-class-names.js';
import type { TextProps } from './text.types.js';

/** Composant typographique léger. L'élément HTML est choisi par le consommateur (`as`, défaut `p`). */
export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { variant = 'body', tone = 'default', as, className, children, ...rest },
  ref,
) {
  return createElement(
    as ?? 'p',
    {
      ref,
      className: mergeClassNames(
        'enistere-text',
        `enistere-text--${variant}`,
        `enistere-text--tone-${tone}`,
        className,
      ),
      ...rest,
    },
    children,
  );
});
