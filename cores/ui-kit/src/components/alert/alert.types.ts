import type { HTMLAttributes, ReactNode } from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

// `title` est redéfini (titre riche `ReactNode`) en remplacement de l'attribut HTML natif `title` (string).
export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Tonalité visuelle (jamais portée par la couleur seule : glyphe décoratif + titre + rôle). */
  variant?: AlertVariant;
  /** Titre court optionnel (rendu avant le contenu). */
  title?: ReactNode;
  /**
   * Rôle ARIA. Par défaut : `status` (poli) pour `info`/`success`/`warning`, `alert` (assertif) pour
   * `danger`. Surchargeable explicitement (ne pas rendre tous les messages `alert` — verbosité AT).
   */
  role?: 'status' | 'alert';
  children: ReactNode;
}
