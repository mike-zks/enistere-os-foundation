import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Tonalité visuelle (conveyée par couleur de texte + bordure, jamais couleur seule). */
  variant?: BadgeVariant;
  /** Taille du badge. Par défaut : `md`. */
  size?: BadgeSize;
  children: ReactNode;
}
