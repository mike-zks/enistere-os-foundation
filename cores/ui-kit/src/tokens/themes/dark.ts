/**
 * Thème DARK — mêmes clés que `light`, références adaptées. Aucune valeur hex en dur.
 */
import type { ThemeColorReferences } from '../contracts.js';

export const darkColorReferences = {
  background: { default: 'neutral.950', muted: 'neutral.900', elevated: 'neutral.800' },
  foreground: { default: 'neutral.50', muted: 'neutral.400', inverse: 'neutral.900' },
  border: { default: 'neutral.700', strong: 'neutral.600', focus: 'brand.400' },
  action: { primary: 'brand.500', primaryHover: 'brand.400', primaryPressed: 'brand.300', disabled: 'neutral.700' },
  status: { success: 'green.500', warning: 'amber.500', danger: 'red.500', info: 'blue.500' },
  focus: { ring: 'brand.400' },
  overlay: 'neutral.950',
} satisfies ThemeColorReferences;
