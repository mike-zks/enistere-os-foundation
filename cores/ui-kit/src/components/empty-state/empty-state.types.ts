import type { HTMLAttributes, ReactNode } from 'react';

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Titre principal de l'état vide. Obligatoire. */
  title: ReactNode;
  /** Description optionnelle. */
  description?: ReactNode;
  /** Slot action (ex. bouton pour créer un élément). */
  action?: ReactNode;
}
