import { forwardRef } from 'react';

import { mergeClassNames } from '../../utilities/merge-class-names.js';
import type { BadgeProps } from './badge.types.js';

/**
 * Étiquette de statut en ligne (texte uniquement, sans icône imposée). La variante est conveyée
 * par la couleur de texte et la bordure — jamais par la couleur seule. Aucun rôle ARIA automatique :
 * ajouter `aria-label` si le contexte visuel ne suffit pas au lecteur d'écran.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = 'neutral', size = 'md', className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={mergeClassNames(
        'enistere-badge',
        `enistere-badge--${variant}`,
        `enistere-badge--${size}`,
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
});
