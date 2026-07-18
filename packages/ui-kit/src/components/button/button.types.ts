import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Désactive l'interaction, affiche un spinner et pose `aria-busy`. */
  loading?: boolean;
  /** Texte visible et accessible affiché pendant le chargement (remplace `children`). */
  loadingText?: string;
}
