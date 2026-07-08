import type { HTMLAttributes } from 'react';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';
export type ToastRegionPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  variant?: ToastVariant;
  /** Titre optionnel (affiché en gras au-dessus du contenu). */
  title?: string;
  /**
   * Rappel du bouton de fermeture. Si absent, le bouton de fermeture n'est pas rendu.
   * Le composant ne gère pas lui-même son cycle de vie (pas de timer interne).
   */
  onDismiss?: () => void;
  /** Libellé accessible du bouton de fermeture. Défaut : `'Fermer'`. */
  dismissLabel?: string;
}

export interface ToastRegionProps extends HTMLAttributes<HTMLDivElement> {
  /** Position fixe de la région dans le viewport. Défaut : `'bottom-right'`. */
  position?: ToastRegionPosition;
}
