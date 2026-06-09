/**
 * Validation des design tokens (aucune écriture de fichier). Détecte : clés vides, valeurs `undefined`,
 * couleurs invalides, nombres non finis / unités invalides, parité des clés light/dark, références non
 * résolues, références circulaires, et conventions de nommage. Renvoie une liste d'erreurs exploitables.
 */
import type { Primitives, ThemeColorReferences } from '../tokens/contracts.js';
import { primitives } from '../tokens/primitives/index.js';
import { SEMANTIC_COLOR_KEYS } from '../tokens/semantic/colors.js';
import { flattenColorPrimitives, flattenThemeReferences, resolveReferenceGraph } from '../tokens/registry.js';
import { darkColorReferences } from '../tokens/themes/dark.js';
import { lightColorReferences } from '../tokens/themes/light.js';

export interface TokenModel {
  primitives: Primitives;
  themeReferences: { light: ThemeColorReferences; dark: ThemeColorReferences };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const HEX = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const KEY = /^[A-Za-z0-9]+$/;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function checkKey(key: string, where: string, errors: string[]): void {
  if (key.length === 0) {
    errors.push(`${where}: empty key`);
  } else if (!KEY.test(key)) {
    errors.push(`${where}: invalid key name "${key}"`);
  }
}

function checkNumberRecord(record: Record<string, unknown>, where: string, errors: string[]): void {
  for (const [key, value] of Object.entries(record)) {
    checkKey(key, where, errors);
    if (!isFiniteNumber(value)) {
      errors.push(`${where}.${key}: not a finite number (${String(value)})`);
    }
  }
}

function validatePrimitives(p: Primitives, errors: string[]): void {
  // Couleurs
  for (const [palette, scale] of Object.entries(p.color)) {
    for (const [shade, hex] of Object.entries(scale as Record<string, unknown>)) {
      checkKey(shade, `color.${palette}`, errors);
      if (typeof hex !== 'string' || !HEX.test(hex)) {
        errors.push(`color.${palette}.${shade}: invalid hex color (${String(hex)})`);
      }
    }
  }
  // Échelles numériques
  checkNumberRecord(p.spacing as Record<string, unknown>, 'spacing', errors);
  checkNumberRecord(p.radius as Record<string, unknown>, 'radius', errors);
  checkNumberRecord(p.breakpoint as Record<string, unknown>, 'breakpoint', errors);
  checkNumberRecord(p.zIndex as Record<string, unknown>, 'zIndex', errors);
  checkNumberRecord(p.typography.fontSize as Record<string, unknown>, 'typography.fontSize', errors);
  checkNumberRecord(p.typography.fontWeight as Record<string, unknown>, 'typography.fontWeight', errors);
  checkNumberRecord(p.typography.lineHeight as Record<string, unknown>, 'typography.lineHeight', errors);
  checkNumberRecord(p.typography.letterSpacing as Record<string, unknown>, 'typography.letterSpacing', errors);
  for (const [key, value] of Object.entries(p.typography.fontFamily)) {
    checkKey(key, 'typography.fontFamily', errors);
    if (typeof value !== 'string' || value.trim().length === 0) {
      errors.push(`typography.fontFamily.${key}: empty font family`);
    }
  }
  // Ombres structurées
  for (const [key, shadow] of Object.entries(p.shadow)) {
    checkKey(key, 'shadow', errors);
    const s = shadow as unknown as Record<string, unknown>;
    for (const field of ['x', 'y', 'blur', 'spread', 'elevation'] as const) {
      if (!isFiniteNumber(s[field])) {
        errors.push(`shadow.${key}.${field}: not a finite number`);
      }
    }
    if (!isFiniteNumber(s['opacity']) || (s['opacity'] as number) < 0 || (s['opacity'] as number) > 1) {
      errors.push(`shadow.${key}.opacity: must be a number in [0,1]`);
    }
    if (typeof s['color'] !== 'string' || !HEX.test(s['color'] as string)) {
      errors.push(`shadow.${key}.color: invalid hex color`);
    }
  }
  // Motion
  checkNumberRecord(p.motion.duration as Record<string, unknown>, 'motion.duration', errors);
  for (const [key, value] of Object.entries(p.motion.duration)) {
    if (isFiniteNumber(value) && value <= 0) {
      errors.push(`motion.duration.${key}: must be > 0`);
    }
  }
  for (const [key, easing] of Object.entries(p.motion.easing)) {
    checkKey(key, 'motion.easing', errors);
    const bezier = (easing as { cubicBezier?: unknown }).cubicBezier;
    if (!Array.isArray(bezier) || bezier.length !== 4 || !bezier.every(isFiniteNumber)) {
      errors.push(`motion.easing.${key}.cubicBezier: must be 4 finite numbers`);
    }
  }
}

function validateThemes(model: TokenModel, errors: string[]): void {
  const terminals = flattenColorPrimitives(model.primitives.color);
  const lightFlat = flattenThemeReferences(model.themeReferences.light);
  const darkFlat = flattenThemeReferences(model.themeReferences.dark);

  // Parité des clés light/dark vs contrat
  const expected = new Set<string>(SEMANTIC_COLOR_KEYS);
  for (const [name, flat] of [
    ['light', lightFlat],
    ['dark', darkFlat],
  ] as const) {
    const keys = new Set(Object.keys(flat));
    for (const key of expected) {
      if (!keys.has(key)) {
        errors.push(`theme.${name}: missing semantic key "${key}"`);
      }
    }
    for (const key of keys) {
      if (!expected.has(key)) {
        errors.push(`theme.${name}: unexpected semantic key "${key}"`);
      }
    }
  }

  // Références résolues (sur primitives connues) + absence de cycle
  for (const [name, flat] of [
    ['light', lightFlat],
    ['dark', darkFlat],
  ] as const) {
    const { errors: refErrors } = resolveReferenceGraph(flat, terminals);
    for (const err of refErrors) {
      errors.push(`theme.${name}: ${err}`);
    }
  }
}

export function validateTokens(model: TokenModel): ValidationResult {
  const errors: string[] = [];
  validatePrimitives(model.primitives, errors);
  validateThemes(model, errors);
  return { valid: errors.length === 0, errors };
}

/** Modèle de tokens par défaut (source de vérité du package). */
export const defaultTokenModel: TokenModel = {
  primitives,
  themeReferences: { light: lightColorReferences, dark: darkColorReferences },
};

export function validateDefaultTokens(): ValidationResult {
  return validateTokens(defaultTokenModel);
}
