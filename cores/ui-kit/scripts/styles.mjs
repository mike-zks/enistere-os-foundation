// @ts-check
/** Construction DÉTERMINISTE du CSS agrégé : tokens.css + CSS des composants (ordre trié). */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function collectCss(dir) {
  const out = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectCss(full));
    } else if (full.endsWith('.css')) {
      out.push(full);
    }
  }
  return out.sort();
}

export function buildStylesContent(tokensCss, componentsDir) {
  const parts = [
    '/* ENISTERE UI KIT — styles agrégés (tokens + primitives). GÉNÉRÉ — NE PAS MODIFIER À LA MAIN.',
    '   Régénérer : npm run tokens:generate · Vérifier : npm run tokens:check. */',
    '',
    tokensCss.trimEnd(),
    '',
  ];
  for (const file of collectCss(componentsDir)) {
    const rel = file.includes('/src/') ? `src/${file.split('/src/')[1]}` : file;
    parts.push(`/* ${rel} */`);
    parts.push(readFileSync(file, 'utf8').trimEnd());
    parts.push('');
  }
  return `${parts.join('\n')}\n`;
}
