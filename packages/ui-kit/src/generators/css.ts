/**
 * Générateur CSS : variables `--enistere-*`. Tokens partagés + couleurs sémantiques LIGHT dans `:root`,
 * couleurs DARK sous `[data-theme="dark"]`. Déterministe. Aucun reset, aucune police téléchargée,
 * aucune valeur métier. Les light/dark exposent EXACTEMENT le même ensemble de variables couleur.
 */
import type { SemanticColors, ShadowToken } from '../tokens/contracts.js';
import { primitives } from '../tokens/primitives/index.js';
import { darkTheme, lightTheme } from '../tokens/registry.js';
import { SEMANTIC_COLOR_KEYS } from '../tokens/semantic/colors.js';

const PREFIX = '--enistere';

/** Convertit un segment en kebab-case lowercase (ex. `primaryHover` → `primary-hover`). */
function kebab(segment: string): string {
  return segment.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function varName(...segments: string[]): string {
  return `${PREFIX}-${segments.map(kebab).join('-')}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const value = hex.replace('#', '').slice(0, 6);
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function shadowToCss(shadow: ShadowToken): string {
  if (shadow.opacity === 0 && shadow.blur === 0 && shadow.y === 0 && shadow.x === 0) {
    return 'none';
  }
  const { r, g, b } = hexToRgb(shadow.color);
  return `${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px rgba(${r}, ${g}, ${b}, ${shadow.opacity})`;
}

function getColor(colors: SemanticColors, path: string): string {
  return path.split('.').reduce<unknown>((acc, key) => (acc as Record<string, unknown>)[key], colors) as string;
}

function pxLines(record: Record<string, number>, category: string): string[] {
  return Object.entries(record).map(([key, value]) => `  ${varName(category, key)}: ${value}px;`);
}

function rawLines(record: Record<string, number>, category: string): string[] {
  return Object.entries(record).map(([key, value]) => `  ${varName(category, key)}: ${value};`);
}

function colorLines(colors: SemanticColors): string[] {
  return SEMANTIC_COLOR_KEYS.map((key) => `  ${varName('color', ...key.split('.'))}: ${getColor(colors, key)};`);
}

export function generateTokensCss(): string {
  const shared: string[] = [];
  shared.push(...pxLines(primitives.spacing as Record<string, number>, 'spacing'));
  shared.push(...pxLines(primitives.radius as Record<string, number>, 'radius'));
  // Typographie
  for (const [key, value] of Object.entries(primitives.typography.fontFamily)) {
    shared.push(`  ${varName('font-family', key)}: ${value};`);
  }
  shared.push(...pxLines(primitives.typography.fontSize as Record<string, number>, 'font-size'));
  shared.push(...rawLines(primitives.typography.fontWeight as Record<string, number>, 'font-weight'));
  shared.push(...rawLines(primitives.typography.lineHeight as Record<string, number>, 'line-height'));
  shared.push(...pxLines(primitives.typography.letterSpacing as Record<string, number>, 'letter-spacing'));
  // Ombres
  for (const [key, shadow] of Object.entries(primitives.shadow)) {
    shared.push(`  ${varName('shadow', key)}: ${shadowToCss(shadow)};`);
  }
  // Motion
  for (const [key, value] of Object.entries(primitives.motion.duration)) {
    shared.push(`  ${varName('duration', key)}: ${value}ms;`);
  }
  for (const [key, easing] of Object.entries(primitives.motion.easing)) {
    const [a, b, c, d] = easing.cubicBezier;
    shared.push(`  ${varName('easing', key)}: cubic-bezier(${a}, ${b}, ${c}, ${d});`);
  }
  shared.push(...pxLines(primitives.breakpoint as Record<string, number>, 'breakpoint'));
  shared.push(...rawLines(primitives.zIndex as Record<string, number>, 'z-index'));

  const lightColors = colorLines(lightTheme.colors);
  const darkColors = colorLines(darkTheme.colors);

  return (
    `/* ENISTERE UI KIT — GENERATED CSS variables. NE PAS MODIFIER À LA MAIN.\n` +
    `   Régénérer : npm run tokens:generate · Vérifier : npm run tokens:check (ADR-008). */\n\n` +
    `:root {\n` +
    `${shared.join('\n')}\n\n` +
    `  /* semantic colors (light, default) */\n` +
    `${lightColors.join('\n')}\n` +
    `}\n\n` +
    `[data-theme="dark"] {\n` +
    `${darkColors.join('\n')}\n` +
    `}\n`
  );
}
