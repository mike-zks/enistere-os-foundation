import type { HTMLAttributes } from 'react';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
  /** Libellé accessible (mode autonome `role="status"`). */
  label?: string;
  /** Mode décoratif (`aria-hidden`) — pour l'usage dans un Button avec texte de chargement. */
  decorative?: boolean;
}
