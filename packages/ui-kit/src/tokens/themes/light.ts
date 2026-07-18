/**
 * Thème LIGHT — références sémantiques → primitives `color.*` (chemins `palette.shade`).
 * Aucune valeur hex en dur : la résolution est faite par `registry.ts`.
 */
import type { ThemeColorReferences } from '../contracts.js';

export const lightColorReferences = {
  background: { default: 'neutral.0', muted: 'neutral.50', elevated: 'neutral.0' },
  foreground: { default: 'neutral.900', muted: 'neutral.500', inverse: 'neutral.0' },
  border: { default: 'neutral.200', strong: 'neutral.300', focus: 'brand.500' },
  action: { primary: 'brand.600', primaryHover: 'brand.700', primaryPressed: 'brand.800', disabled: 'neutral.300' },
  status: { success: 'green.600', warning: 'amber.500', danger: 'red.600', info: 'blue.600' },
  focus: { ring: 'brand.500' },
  overlay: 'neutral.900',
} satisfies ThemeColorReferences;
