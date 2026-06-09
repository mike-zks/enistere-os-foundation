import type { InputHTMLAttributes } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

/** `size` est redéfini (token sm/md/lg) en remplacement de l'attribut natif `size` (number). */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  /** Marque le champ invalide (`aria-invalid`) + style d'erreur. Le message reste géré ailleurs. */
  invalid?: boolean;
}
