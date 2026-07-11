import type { HTMLAttributes, ReactNode } from 'react';

import type { SpinnerSize } from '../spinner/spinner.types.js';

export interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Message affiché sous l'indicateur de chargement. Optionnel. */
  message?: ReactNode;
  /** Taille du spinner interne. */
  size?: SpinnerSize;
}
