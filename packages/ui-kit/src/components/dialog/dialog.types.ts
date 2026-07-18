import type { HTMLAttributes } from 'react';

export interface DialogProps extends HTMLAttributes<HTMLDialogElement> {
  /** Contrôle l'ouverture via `showModal()` / `close()`. */
  open: boolean;
  /** Rappelé lors d'un appui ESC ou d'un clic hors du panneau (backdrop). */
  onDismiss?: () => void;
}

export type DialogTitleElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';

export interface DialogSectionProps extends HTMLAttributes<HTMLDivElement> {}

export interface DialogTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Niveau sémantique du titre. `h2` par défaut (adapté aux structures de page courantes). */
  as?: DialogTitleElement;
}

export interface DialogDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}
