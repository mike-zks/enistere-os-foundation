/**
 * Contrat des couleurs SÉMANTIQUES (intentions d'usage). Les valeurs concrètes sont fournies PAR
 * THÈME (light/dark) en référençant des primitives `color.*`. Cette liste ordonnée est la source de
 * l'ordre déterministe de génération et du contrôle de parité light/dark.
 */
export const SEMANTIC_COLOR_KEYS = [
  'background.default',
  'background.muted',
  'background.elevated',
  'foreground.default',
  'foreground.muted',
  'foreground.inverse',
  'border.default',
  'border.strong',
  'border.focus',
  'action.primary',
  'action.primaryHover',
  'action.primaryPressed',
  'action.disabled',
  'status.success',
  'status.warning',
  'status.danger',
  'status.info',
  'focus.ring',
  'overlay',
] as const;

export type SemanticColorKey = (typeof SEMANTIC_COLOR_KEYS)[number];
