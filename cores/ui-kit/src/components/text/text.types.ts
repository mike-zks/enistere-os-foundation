import type { HTMLAttributes } from 'react';

export type TextVariant = 'display' | 'heading' | 'title' | 'body' | 'label' | 'caption' | 'code';
export type TextTone = 'default' | 'muted' | 'inverse' | 'success' | 'warning' | 'danger' | 'info';
/** Élément HTML rendu — le consommateur choisit (le composant n'impose pas de hiérarchie de titres). */
export type TextElement = 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'label' | 'code';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
  tone?: TextTone;
  as?: TextElement;
}
