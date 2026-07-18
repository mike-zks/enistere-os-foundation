// @ts-check
/**
 * Génération DÉTERMINISTE des types OpenAPI canoniques pour `@enistere/api-contracts`.
 *
 *   node scripts/generate.mjs           → (ré)écrit src/generated/schema.ts
 *   node scripts/generate.mjs --check   → échoue (code 1) si l'artefact suivi diverge du contrat
 *
 * Source UNIQUE : starters/nestjs/openapi/openapi.json (contrat canonique, ADR-016), lu en `file://`
 * (jamais un serveur HTTP, jamais /docs, jamais une URL de production). En-tête statique (aucun
 * timestamp) ⇒ deux générations successives produisent un fichier identique (reproductibilité).
 *
 * Le mode --check génère dans un fichier temporaire, le compare à l'artefact suivi, puis le nettoie.
 */
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import openapiTS, { astToString } from 'openapi-typescript';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(SCRIPT_DIR, '..');
const REPO_ROOT = resolve(PACKAGE_ROOT, '..', '..');
const CONTRACT_PATH = resolve(REPO_ROOT, 'starters', 'nestjs', 'openapi', 'openapi.json');
const OUTPUT_PATH = join(PACKAGE_ROOT, 'src', 'generated', 'schema.ts');

const HEADER = [
  '/**',
  ' * ENISTERE — Types OpenAPI GÉNÉRÉS. NE PAS MODIFIER À LA MAIN.',
  ' *',
  ' * Source de vérité : starters/nestjs/openapi/openapi.json (contrat canonique, ADR-016).',
  ' * Régénérer : npm run generate   ·   Vérifier la fraîcheur : npm run generate:check',
  ' *',
  ' * Fichier types-only (aucun runtime). Outil : openapi-typescript.',
  ' */',
  '',
].join('\n');

async function generateContents() {
  if (!existsSync(CONTRACT_PATH)) {
    console.error(`Contrat introuvable : ${CONTRACT_PATH}`);
    process.exit(1);
  }
  const ast = await openapiTS(pathToFileURL(CONTRACT_PATH), { alphabetize: true });
  return `${HEADER}${astToString(ast)}`;
}

const isCheck = process.argv.includes('--check');
const contents = await generateContents();

if (isCheck) {
  // Génère dans un répertoire temporaire, compare, puis nettoie.
  const tmp = mkdtempSync(join(tmpdir(), 'enistere-contracts-'));
  const tmpFile = join(tmp, 'schema.ts');
  writeFileSync(tmpFile, contents);
  const current = existsSync(OUTPUT_PATH) ? readFileSync(OUTPUT_PATH, 'utf8') : '';
  const fresh = readFileSync(tmpFile, 'utf8');
  rmSync(tmp, { recursive: true, force: true });
  if (current !== fresh) {
    console.error('Types générés obsolètes ou absents. Lancer : npm run generate');
    process.exit(1);
  }
  console.log(JSON.stringify({ mode: 'check', status: 'up-to-date', path: OUTPUT_PATH }, null, 2));
} else {
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, contents);
  console.log(JSON.stringify({ mode: 'generate', path: OUTPUT_PATH, bytes: contents.length }, null, 2));
}
