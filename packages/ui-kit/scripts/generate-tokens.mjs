// @ts-check
/**
 * Valide puis génère les artefacts déterministes dans `generated/` (tokens.json, typescript/tokens.ts,
 * css/tokens.css). Importe le build (`dist/`) — exécuter `npm run build` au préalable (le script npm
 * `tokens:generate` s'en charge).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateAll } from '../dist/generators/index.js';
import { validateDefaultTokens } from '../dist/validation/validate-tokens.js';
import { buildStylesContent } from './styles.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GEN = join(ROOT, 'generated');

const result = validateDefaultTokens();
if (!result.valid) {
  console.error('Token validation failed:\n' + result.errors.join('\n'));
  process.exit(1);
}

const { json, typescript, css } = generateAll();
mkdirSync(join(GEN, 'typescript'), { recursive: true });
mkdirSync(join(GEN, 'css'), { recursive: true });
writeFileSync(join(GEN, 'tokens.json'), json);
writeFileSync(join(GEN, 'typescript', 'tokens.ts'), typescript);
writeFileSync(join(GEN, 'css', 'tokens.css'), css);
writeFileSync(join(GEN, 'css', 'styles.css'), buildStylesContent(css, join(ROOT, 'src', 'components')));

console.log(
  JSON.stringify(
    {
      mode: 'generate',
      files: ['tokens.json', 'typescript/tokens.ts', 'css/tokens.css', 'css/styles.css'],
      path: GEN,
    },
    null,
    2,
  ),
);
