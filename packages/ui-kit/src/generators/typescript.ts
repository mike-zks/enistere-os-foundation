/**
 * Générateur de l'artefact TypeScript. Déterministe (sérialisation stable + `as const`). L'artefact
 * mirroite les valeurs résolues ; il N'EST PAS édité à la main et dérive de `src/` (aucune duplication
 * manuelle des valeurs).
 */
import { primitives } from '../tokens/primitives/index.js';
import { darkTheme, lightTheme } from '../tokens/registry.js';
import { semanticTypography } from '../tokens/semantic/typography.js';
import { TOKENS_VERSION } from '../tokens/meta.js';

const HEADER = [
  '/**',
  ' * ENISTERE UI KIT — Tokens GÉNÉRÉS. NE PAS MODIFIER À LA MAIN.',
  ' * Régénérer : npm run tokens:generate   ·   Vérifier : npm run tokens:check',
  ' * Source : packages/ui-kit/src/tokens/ (ADR-008).',
  ' */',
  '',
].join('\n');

function literal(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function generateTokensTs(): string {
  return (
    `${HEADER}` +
    `export const tokensVersion = ${JSON.stringify(TOKENS_VERSION)} as const;\n\n` +
    `export const primitives = ${literal(primitives)} as const;\n\n` +
    `export const semanticTypography = ${literal(semanticTypography)} as const;\n\n` +
    `export const lightTheme = ${literal(lightTheme)} as const;\n\n` +
    `export const darkTheme = ${literal(darkTheme)} as const;\n`
  );
}
