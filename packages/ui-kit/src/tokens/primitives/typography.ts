/**
 * Typographie PRIMITIVE. Familles = stacks système génériques (aucune police externe téléchargée).
 * `fontSize`/`letterSpacing` en px canoniques ; `lineHeight` = ratio sans unité ; `fontWeight` = nombre.
 */
import type { TypographyPrimitives } from '../contracts.js';

export const typography = {
  fontFamily: {
    sans: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
  letterSpacing: {
    tight: -0.2,
    normal: 0,
    wide: 0.4,
  },
} satisfies TypographyPrimitives;
