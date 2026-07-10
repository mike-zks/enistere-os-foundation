import type { HTMLAttributes, ReactNode } from 'react';

export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Direction du séparateur. Par défaut : `horizontal`. */
  orientation?: DividerOrientation;
  /**
   * Contenu textuel optionnel centré sur la ligne (ex. "OU"). Quand renseigné, le séparateur
   * devient sémantique (`role="separator"`) au lieu de décoratif (`aria-hidden="true"`).
   */
  label?: ReactNode;
}
