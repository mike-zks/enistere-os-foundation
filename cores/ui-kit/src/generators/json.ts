/**
 * Générateur de l'artefact JSON canonique. Déterministe : ordre d'insertion stable, aucune date,
 * aucun chemin absolu, aucun hostname, aucun secret. Deux exécutions produisent un fichier identique.
 */
import { primitives } from '../tokens/primitives/index.js';
import { darkTheme, lightTheme } from '../tokens/registry.js';
import { semanticTypography } from '../tokens/semantic/typography.js';
import { TOKENS_VERSION } from '../tokens/meta.js';

export function generateTokensJson(): string {
  const doc = {
    version: TOKENS_VERSION,
    metadata: {
      generator: '@enistere/ui-kit',
      note: 'GENERATED — do not edit by hand. Run `npm run tokens:generate`.',
    },
    primitives,
    semantic: { typography: semanticTypography },
    themes: { light: lightTheme.colors, dark: darkTheme.colors },
  };
  return `${JSON.stringify(doc, null, 2)}\n`;
}
