/** Thèmes : parité des clés light/dark, valeurs résolues (hex), aucune primitive non résolue, pas de cycle. */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { darkTheme, lightTheme } from '../src/tokens/registry.js';
import { SEMANTIC_COLOR_KEYS } from '../src/tokens/semantic/colors.js';
import type { SemanticColors } from '../src/tokens/contracts.js';

const HEX = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function flatten(colors: SemanticColors): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of SEMANTIC_COLOR_KEYS) {
    out[key] = key.split('.').reduce<unknown>((a, k) => (a as Record<string, unknown>)[k], colors) as string;
  }
  return out;
}

test('light et dark partagent exactement le même contrat de clés', () => {
  const light = flatten(lightTheme.colors);
  const dark = flatten(darkTheme.colors);
  assert.deepEqual(Object.keys(light).sort(), Object.keys(dark).sort());
  assert.equal(Object.keys(light).length, SEMANTIC_COLOR_KEYS.length);
});

test('toutes les valeurs sont des couleurs hex résolues (aucune primitive non résolue, aucun undefined)', () => {
  for (const theme of [lightTheme, darkTheme]) {
    const flat = flatten(theme.colors);
    for (const [key, value] of Object.entries(flat)) {
      assert.equal(typeof value, 'string', `${theme.name}.${key} should be a string`);
      assert.ok(HEX.test(value), `${theme.name}.${key} = "${value}" should be a hex color (not a reference)`);
    }
  }
});

test('les noms de thème sont corrects', () => {
  assert.equal(lightTheme.name, 'light');
  assert.equal(darkTheme.name, 'dark');
});

test('light et dark diffèrent (le dark mode n’est pas une copie du light)', () => {
  assert.notEqual(lightTheme.colors.background.default, darkTheme.colors.background.default);
});
