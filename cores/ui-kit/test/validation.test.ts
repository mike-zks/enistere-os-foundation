/** Validation : cas positif + cas négatifs (couleur, valeur, token dark, ref inconnue, cycle, non-fini, unité). */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveReferenceGraph } from '../src/tokens/registry.js';
import {
  defaultTokenModel,
  validateDefaultTokens,
  validateTokens,
  type TokenModel,
} from '../src/validation/validate-tokens.js';

function clone(): TokenModel {
  return structuredClone(defaultTokenModel);
}

test('les tokens par défaut sont valides', () => {
  const { valid, errors } = validateDefaultTokens();
  assert.equal(valid, true, errors.join('\n'));
  assert.equal(errors.length, 0);
});

test('détecte une couleur invalide', () => {
  const m = clone();
  (m.primitives.color.neutral as Record<string, string>)['0'] = 'not-a-color';
  const { valid, errors } = validateTokens(m);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('color.neutral.0')));
});

test('détecte une valeur absente / non finie', () => {
  const m = clone();
  (m.primitives.spacing as Record<string, unknown>)['4'] = undefined;
  const r1 = validateTokens(m);
  assert.equal(r1.valid, false);
  assert.ok(r1.errors.some((e) => e.includes('spacing.4')));

  const m2 = clone();
  (m2.primitives.radius as Record<string, unknown>)['md'] = Number.POSITIVE_INFINITY;
  const r2 = validateTokens(m2);
  assert.equal(r2.valid, false);
  assert.ok(r2.errors.some((e) => e.includes('radius.md')));
});

test('détecte une unité invalide (string là où un nombre est attendu)', () => {
  const m = clone();
  (m.primitives.spacing as Record<string, unknown>)['4'] = '16px';
  const { valid, errors } = validateTokens(m);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('spacing.4')));
});

test('détecte un token de thème dark manquant', () => {
  const m = clone();
  delete (m.themeReferences.dark.background as Record<string, unknown>)['default'];
  const { valid, errors } = validateTokens(m);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('dark') && e.includes('background.default')));
});

test('détecte une référence inconnue', () => {
  const m = clone();
  m.themeReferences.light.action.primary = 'brand.999';
  const { valid, errors } = validateTokens(m);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('unknown reference') && e.includes('brand.999')));
});

test('détecte une référence circulaire (resolver)', () => {
  const { errors } = resolveReferenceGraph({ a: 'b', b: 'a' }, {});
  assert.ok(errors.some((e) => e.includes('circular reference')));
});

test('détecte un nom de clé invalide', () => {
  const m = clone();
  (m.primitives.spacing as Record<string, unknown>)['bad key'] = 4;
  const { valid, errors } = validateTokens(m);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('invalid key name')));
});
