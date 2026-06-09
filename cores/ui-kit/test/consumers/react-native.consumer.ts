/**
 * Fixture de COMPILATION (non exécutée) — préparation React Native.
 * Démontre : tokens numériques consommables, couleurs en chaînes, ombres structurées, AUCUNE API DOM,
 * aucune dépendance React Native/Expo. (La création d'un ThemeProvider RN est hors de cette mission.)
 */
import { darkTheme, lightTheme, tokens, type ShadowToken, type ThemeTokens } from '../../src/index.js';

/** Style "carte" agnostique (forme proche d'un StyleSheet React Native). */
export function buildCardStyle(theme: ThemeTokens) {
  const shadow: ShadowToken = tokens.primitives.shadow['md'] ?? tokens.primitives.shadow['sm'] ?? {
    x: 0,
    y: 0,
    blur: 0,
    spread: 0,
    color: '#000000',
    opacity: 0,
    elevation: 0,
  };
  return {
    backgroundColor: theme.colors.background.elevated, // string (#RRGGBB)
    borderColor: theme.colors.border.default, // string
    padding: tokens.typography.body.fontSize, // number (dp)
    borderRadius: 8,
    shadowColor: shadow.color, // string
    shadowOffset: { width: shadow.x, height: shadow.y }, // numbers
    shadowOpacity: shadow.opacity, // number
    shadowRadius: shadow.blur, // number
    elevation: shadow.elevation, // number (Android)
  };
}

export const lightCard = buildCardStyle(lightTheme);
export const darkCard = buildCardStyle(darkTheme);
