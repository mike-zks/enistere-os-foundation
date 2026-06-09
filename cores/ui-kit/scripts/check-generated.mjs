// @ts-check
/**
 * Vérifie la fraîcheur des artefacts : régénère dans un répertoire TEMPORAIRE, compare avec
 * `generated/`, échoue (code 1) en cas de divergence, puis nettoie le temporaire. Valide aussi les
 * tokens. Ne modifie jamais `generated/`.
 */
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateAll } from '../dist/generators/index.js';
import { validateDefaultTokens } from '../dist/validation/validate-tokens.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GEN = join(ROOT, 'generated');

const result = validateDefaultTokens();
if (!result.valid) {
  console.error('Token validation failed:\n' + result.errors.join('\n'));
  process.exit(1);
}

const { json, typescript, css } = generateAll();
const targets = [
  ['tokens.json', json],
  [join('typescript', 'tokens.ts'), typescript],
  [join('css', 'tokens.css'), css],
];

const tmp = mkdtempSync(join(tmpdir(), 'enistere-ui-gen-'));
const drift = [];
try {
  for (const [rel, content] of targets) {
    const tmpFile = join(tmp, rel);
    mkdirSync(dirname(tmpFile), { recursive: true });
    writeFileSync(tmpFile, content);
    const committed = existsSync(join(GEN, rel)) ? readFileSync(join(GEN, rel), 'utf8') : '';
    const fresh = readFileSync(tmpFile, 'utf8');
    if (committed !== fresh) {
      drift.push(rel);
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (drift.length > 0) {
  console.error('Generated artifacts are stale. Run: npm run tokens:generate\nDrift: ' + drift.join(', '));
  process.exit(1);
}
console.log(JSON.stringify({ mode: 'check', status: 'up-to-date' }, null, 2));
