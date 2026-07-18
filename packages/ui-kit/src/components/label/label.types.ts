import type { LabelHTMLAttributes } from 'react';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** Affiche un indicateur visuel requis (décoratif ; la source de vérité reste le champ). */
  required?: boolean;
}
