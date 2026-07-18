/** Génération : déterminisme, JSON (version, pas de date), TS (header + as const), divergence détectable. */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { generateAll, generateTokensCss, generateTokensJson, generateTokensTs } from '../src/generators/index.js';

test('génération déterministe (deux exécutions identiques)', () => {
  const a = generateAll();
  const b = generateAll();
  assert.equal(a.json, b.json);
  assert.equal(a.typescript, b.typescript);
  assert.equal(a.css, b.css);
});

test('JSON : version, structure, aucune date/horodatage', () => {
  const json = generateTokensJson();
  const doc = JSON.parse(json) as Record<string, unknown>;
  assert.equal(doc['version'], '0.1.0');
  assert.ok(doc['primitives']);
  assert.ok(doc['themes']);
  assert.ok((doc['themes'] as Record<string, unknown>)['light']);
  assert.ok((doc['themes'] as Record<string, unknown>)['dark']);
  // Pas de date dynamique (déterminisme)
  assert.ok(!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(json), 'no ISO timestamp expected');
  assert.ok(json.endsWith('\n'));
});

test('TypeScript : header généré + as const', () => {
  const ts = generateTokensTs();
  assert.match(ts, /NE PAS MODIFIER À LA MAIN/);
  assert.match(ts, /export const tokensVersion = "0\.1\.0" as const;/);
  assert.match(ts, /export const lightTheme = \{[\s\S]*\} as const;/);
});

test('divergence détectable (toute mutation change la sortie)', () => {
  const css = generateTokensCss();
  const mutated = css.replace('--enistere-spacing-0', '--enistere-spacing-zero');
  assert.notEqual(css, mutated, 'a change in names must change the output (check mechanism)');
});
