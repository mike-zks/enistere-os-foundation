import type { HTMLAttributes } from 'react';

/** Élément du titre de carte — le consommateur choisit le niveau (la Card n'impose aucune hiérarchie). */
export type CardTitleElement = 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';

export type CardProps = HTMLAttributes<HTMLDivElement>;
export type CardSectionProps = HTMLAttributes<HTMLDivElement>;
export type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Élément rendu. **Défaut `p`** (aucun titre imposé dans l'outline) ; passer `as="h2"`/… pour l'y placer. */
  as?: CardTitleElement;
}
