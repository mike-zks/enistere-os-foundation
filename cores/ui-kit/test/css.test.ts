/** Preuve CSS : :root, dark theme, préfixe --enistere-, parité du nombre de variables couleur, aucune vide/undefined. */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { generateTokensCss } from '../src/generators/css.js';
import { SEMANTIC_COLOR_KEYS } from '../src/tokens/semantic/colors.js';

const css = generateTokensCss();

test('contient :root et [data-theme="dark"]', () => {
  assert.match(css, /:root\s*\{/);
  assert.match(css, /\[data-theme="dark"\]\s*\{/);
});

test('toutes les variables sont préfixées --enistere-', () => {
  const vars = css.match(/--[a-z0-9-]+(?=:)/gi) ?? [];
  assert.ok(vars.length > 0);
  for (const v of vars) {
    assert.ok(v.startsWith('--enistere-'), `unexpected prefix: ${v}`);
  }
});

test('même nombre de variables couleur en light (:root) et dark', () => {
  const root = css.slice(css.indexOf(':root'), css.indexOf('[data-theme'));
  const dark = css.slice(css.indexOf('[data-theme'));
  const countColor = (block: string): number => (block.match(/--enistere-color-[a-z0-9-]+:/g) ?? []).length;
  assert.equal(countColor(root), SEMANTIC_COLOR_KEYS.length);
  assert.equal(countColor(dark), SEMANTIC_COLOR_KEYS.length);
});

test('aucune variable vide ni undefined', () => {
  const decls = css.match(/--enistere-[a-z0-9-]+:\s*[^;]+;/gi) ?? [];
  assert.ok(decls.length > 0);
  for (const d of decls) {
    assert.ok(!/:\s*;/.test(d), `empty value: ${d}`);
    assert.ok(!/undefined/.test(d), `undefined value: ${d}`);
    assert.ok(!/NaN/.test(d), `NaN value: ${d}`);
  }
});

test('light par défaut dans :root, dark via attribut explicite', () => {
  const root = css.slice(css.indexOf(':root'), css.indexOf('[data-theme'));
  assert.match(root, /--enistere-color-background-default:\s*#FFFFFF;/);
});
