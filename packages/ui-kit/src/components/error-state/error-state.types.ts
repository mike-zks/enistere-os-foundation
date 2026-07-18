import type { HTMLAttributes, ReactNode } from 'react';

export interface ErrorStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Titre générique de l'erreur. */
  title: ReactNode;
  /** Message d'erreur (jamais de détails sensibles bruts). Optionnel. */
  message?: ReactNode;
  /** Slot action (ex. bouton Réessayer). Optionnel. */
  action?: ReactNode;
  /** Rôle ARIA. Par défaut : `alert` (assertif). Surchargeable si contexte moins urgent. */
  role?: 'alert' | 'status';
}
