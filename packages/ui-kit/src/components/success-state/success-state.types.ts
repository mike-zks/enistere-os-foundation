import type { HTMLAttributes, ReactNode } from 'react';

export interface SuccessStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Titre du message de succès. */
  title: ReactNode;
  /** Message complémentaire optionnel. */
  message?: ReactNode;
  /** Slot action optionnel. */
  action?: ReactNode;
  /** Rôle ARIA. Par défaut : `status` (poli, non intrusif). */
  role?: 'status' | 'alert';
}
