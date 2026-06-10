import { forwardRef, type ReactElement } from 'react';

import { mergeClassNames } from '../../utilities/merge-class-names.js';
import type { CardDescriptionProps, CardProps, CardSectionProps, CardTitleProps } from './card.types.js';

/**
 * Conteneur **visuel générique** (aucune logique métier/dashboard, aucun rôle imposé). Composition par
 * slots optionnels : `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter`.
 * Une Card interactive est hors périmètre : placer un `Button`/lien natif dans son contenu.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card({ className, ...rest }, ref) {
  return <div ref={ref} className={mergeClassNames('enistere-card', className)} {...rest} />;
});

export const CardHeader = forwardRef<HTMLDivElement, CardSectionProps>(function CardHeader(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={mergeClassNames('enistere-card__header', className)} {...rest} />;
});

export const CardContent = forwardRef<HTMLDivElement, CardSectionProps>(function CardContent(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={mergeClassNames('enistere-card__content', className)} {...rest} />;
});

export const CardFooter = forwardRef<HTMLDivElement, CardSectionProps>(function CardFooter(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={mergeClassNames('enistere-card__footer', className)} {...rest} />;
});

/** Titre de carte. **N'impose aucun niveau** : `as="p"` par défaut, `as="h2"`/… pour l'outline. */
export function CardTitle({ as: As = 'p', className, ...rest }: CardTitleProps): ReactElement {
  return <As className={mergeClassNames('enistere-card__title', className)} {...rest} />;
}

export function CardDescription({ className, ...rest }: CardDescriptionProps): ReactElement {
  return <p className={mergeClassNames('enistere-card__description', className)} {...rest} />;
}
