/**
 * Styles typographiques SÉMANTIQUES (intentions d'usage), construits depuis les primitives.
 * Théme-indépendants. Les composants utilisent ces styles, pas les primitives directement.
 */
import type { SemanticTypography } from '../contracts.js';
import { typography as t } from '../primitives/typography.js';

export const semanticTypography = {
  display: { fontFamily: t.fontFamily.sans, fontSize: t.fontSize['4xl'], fontWeight: t.fontWeight.bold, lineHeight: t.lineHeight.tight, letterSpacing: t.letterSpacing.tight },
  heading: { fontFamily: t.fontFamily.sans, fontSize: t.fontSize['3xl'], fontWeight: t.fontWeight.bold, lineHeight: t.lineHeight.tight, letterSpacing: t.letterSpacing.tight },
  title: { fontFamily: t.fontFamily.sans, fontSize: t.fontSize.xl, fontWeight: t.fontWeight.semibold, lineHeight: t.lineHeight.normal, letterSpacing: t.letterSpacing.normal },
  body: { fontFamily: t.fontFamily.sans, fontSize: t.fontSize.md, fontWeight: t.fontWeight.regular, lineHeight: t.lineHeight.normal, letterSpacing: t.letterSpacing.normal },
  label: { fontFamily: t.fontFamily.sans, fontSize: t.fontSize.sm, fontWeight: t.fontWeight.medium, lineHeight: t.lineHeight.normal, letterSpacing: t.letterSpacing.normal },
  caption: { fontFamily: t.fontFamily.sans, fontSize: t.fontSize.xs, fontWeight: t.fontWeight.regular, lineHeight: t.lineHeight.normal, letterSpacing: t.letterSpacing.wide },
  code: { fontFamily: t.fontFamily.mono, fontSize: t.fontSize.sm, fontWeight: t.fontWeight.regular, lineHeight: t.lineHeight.normal, letterSpacing: t.letterSpacing.normal },
} satisfies SemanticTypography;
