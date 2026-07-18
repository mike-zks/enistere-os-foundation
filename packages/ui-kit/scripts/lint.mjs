// @ts-check
/**
 * Lint léger SANS dépendance externe (cohérent avec les standards minimalistes des packages
 * existants ; ESLint pourra être aligné plus tard au niveau monorepo). Vérifie des conventions de
 * base sur `src/` et `test/` ; le typage est couvert par `typecheck` (tsc strict).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir) {
  /** @type {string[]} */
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
    } else if (extname(full) === '.ts' || extname(full) === '.tsx') {
      files.push(full);
    }
  }
  return files;
}

const problems = [];
for (const base of ['src', 'test']) {
  const dir = join(ROOT, base);
  let files = [];
  try {
    files = walk(dir);
  } catch {
    continue;
  }
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const rel = file.slice(ROOT.length + 1);
    text.split('\n').forEach((line, i) => {
      const at = `${rel}:${i + 1}`;
      if (/\b(?:it|test|describe)\.only\(/.test(line)) {
        problems.push(`${at}: focused test (.only) not allowed`);
      }
      if (/\b(TODO|FIXME)\b/.test(line)) {
        problems.push(`${at}: leftover ${line.includes('TODO') ? 'TODO' : 'FIXME'} marker`);
      }
      // console.log interdit dans src/ (les scripts .mjs sont hors src/)
      if (base === 'src' && /\bconsole\.log\(/.test(line)) {
        problems.push(`${at}: console.log not allowed in src`);
      }
    });
  }
}

if (problems.length > 0) {
  console.error('Lint problems:\n' + problems.map((p) => `  - ${p}`).join('\n'));
  process.exit(1);
}
console.log(JSON.stringify({ status: 'ok', checked: ['src', 'test'] }, null, 2));
