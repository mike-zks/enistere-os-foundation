/**
 * Consommateur TypeScript générique : typage strict, accès aux valeurs, AUCUNE dépendance framework,
 * AUCUNE dépendance DOM, AUCUNE API Node au runtime. (En production : `import … from '@enistere/ui-kit'`
 * — résolu vers `dist/` via le champ `exports` ; ici on importe la source pour rester robuste au build.)
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { darkTheme, lightTheme, tokens, validateDefaultTokens } from '../src/index.js';

test('accès typé aux couleurs sémantiques (chaînes)', () => {
  const primary: string = lightTheme.colors.action.primary;
  const bgDark: string = darkTheme.colors.background.default;
  assert.ok(primary.startsWith('#'));
  assert.ok(bgDark.startsWith('#'));
});

test('accès typé aux valeurs numériques (typographie)', () => {
  const size: number = tokens.typography.body.fontSize;
  const weight: number = tokens.typography.heading.fontWeight;
  assert.equal(typeof size, 'number');
  assert.ok(Number.isFinite(size) && size > 0);
  assert.equal(typeof weight, 'number');
});

test('agrégat tokens expose primitives + thèmes', () => {
  assert.ok(tokens.primitives.color.brand['600']);
  assert.equal(tokens.themes.light.name, 'light');
  assert.equal(tokens.themes.dark.name, 'dark');
});

test('validation publique disponible et verte', () => {
  assert.equal(validateDefaultTokens().valid, true);
});
