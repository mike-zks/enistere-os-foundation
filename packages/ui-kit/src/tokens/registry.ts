/**
 * Registre des tokens : aplatissement des primitives couleur, résolution des références de thème
 * (avec détection de référence manquante et circulaire), assemblage des thèmes résolus et des tokens
 * partagés. C'est ici que `light`/`dark` deviennent des valeurs concrètes — sans duplication manuelle.
 */
import type {
  ColorPrimitives,
  SemanticColors,
  SharedTokens,
  ThemeColorReferences,
  ThemeName,
  ThemeTokens,
} from './contracts.js';
import { primitives } from './primitives/index.js';
import { SEMANTIC_COLOR_KEYS } from './semantic/colors.js';
import { semanticTypography } from './semantic/typography.js';
import { darkColorReferences } from './themes/dark.js';
import { lightColorReferences } from './themes/light.js';

function getByPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

function setByPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let cursor = target;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i] as string;
    if (typeof cursor[key] !== 'object' || cursor[key] === null) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[keys[keys.length - 1] as string] = value;
}

/** Aplati les primitives couleur en `palette.shade -> hex` (terminaux de résolution). */
export function flattenColorPrimitives(color: ColorPrimitives): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [palette, scale] of Object.entries(color) as [string, Record<string, string>][]) {
    for (const [shade, hex] of Object.entries(scale)) {
      out[`${palette}.${shade}`] = hex;
    }
  }
  return out;
}

/** Aplati les références d'un thème en `semanticKey -> referenceTarget`. */
export function flattenThemeReferences(refs: ThemeColorReferences): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of SEMANTIC_COLOR_KEYS) {
    out[key] = getByPath(refs, key) as string;
  }
  return out;
}

export interface RefResolution {
  resolved: Record<string, string>;
  errors: string[];
}

/**
 * Résout un graphe de références : chaque entrée pointe vers un terminal (primitive) ou vers une autre
 * entrée. Détecte les références **inconnues** et **circulaires**. En production, chaque entrée pointe
 * directement vers une primitive (résolution en un saut).
 */
export function resolveReferenceGraph(
  entries: Record<string, string>,
  terminals: Record<string, string>,
): RefResolution {
  const resolved: Record<string, string> = {};
  const errors: string[] = [];
  for (const startKey of Object.keys(entries)) {
    const seen = new Set<string>([startKey]);
    let target = entries[startKey] as string;
    for (;;) {
      if (target in terminals) {
        resolved[startKey] = terminals[target] as string;
        break;
      }
      if (target in entries) {
        if (seen.has(target)) {
          errors.push(`circular reference: ${startKey} -> ... -> ${target}`);
          break;
        }
        seen.add(target);
        target = entries[target] as string;
        continue;
      }
      errors.push(`unknown reference: ${startKey} -> ${target}`);
      break;
    }
  }
  return { resolved, errors };
}

function nestSemanticColors(flat: Record<string, string>): SemanticColors {
  const out: Record<string, unknown> = {};
  for (const key of SEMANTIC_COLOR_KEYS) {
    setByPath(out, key, flat[key]);
  }
  return out as unknown as SemanticColors;
}

export interface BuiltTheme {
  theme: ThemeTokens;
  errors: string[];
}

export function buildTheme(
  name: ThemeName,
  refs: ThemeColorReferences,
  colorPrimitives: ColorPrimitives,
): BuiltTheme {
  const terminals = flattenColorPrimitives(colorPrimitives);
  const entries = flattenThemeReferences(refs);
  const { resolved, errors } = resolveReferenceGraph(entries, terminals);
  return { theme: { name, colors: nestSemanticColors(resolved) }, errors };
}

export const lightTheme: ThemeTokens = buildTheme('light', lightColorReferences, primitives.color).theme;
export const darkTheme: ThemeTokens = buildTheme('dark', darkColorReferences, primitives.color).theme;

export const sharedTokens: SharedTokens = {
  spacing: primitives.spacing,
  radius: primitives.radius,
  shadow: primitives.shadow,
  typography: semanticTypography,
  motion: primitives.motion,
  breakpoint: primitives.breakpoint,
  zIndex: primitives.zIndex,
};
