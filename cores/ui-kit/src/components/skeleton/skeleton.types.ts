import type { HTMLAttributes } from 'react';

export type SkeletonVariant = 'text' | 'block' | 'circle';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Forme du squelette de chargement.
   * - `text` : ligne de texte (hauteur `font-size-md`, pleine largeur).
   * - `block` : bloc rectangulaire (hauteur `spacing-12`, pleine largeur).
   * - `circle` : cercle (nécessite `style={{ width, height }}` égaux pour la forme).
   * Par défaut : `text`.
   */
  variant?: SkeletonVariant;
}
