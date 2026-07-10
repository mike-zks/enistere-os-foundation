import { forwardRef } from 'react';

import { mergeClassNames } from '../../utilities/merge-class-names.js';
import type { SkeletonProps } from './skeleton.types.js';

/**
 * Placeholder de chargement (squelette) affiché pendant la résolution de contenu. Toujours
 * `aria-hidden="true"` — l'état de chargement est annoncé par un `role="status"` parent ou un
 * `Spinner` séparé. Animation CSS avec respect de `prefers-reduced-motion`. Dimensions
 * ajustables via `style` (ex. `style={{ width: '120px' }}` pour un texte partiel).
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { variant = 'text', className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      {...rest}
      aria-hidden="true"
      className={mergeClassNames('enistere-skeleton', `enistere-skeleton--${variant}`, className)}
    />
  );
});
