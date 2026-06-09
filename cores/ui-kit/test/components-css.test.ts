/** Tests CSS des composants : tokens uniquement (aucun hex), aucun style global destructif, dark/reduced-motion/focus. */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const COMPONENTS_DIR = join(process.cwd(), 'src', 'components');
const STYLES_CSS = join(process.cwd(), 'generated', 'css', 'styles.css');

function collectCss(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectCss(full));
    } else if (full.endsWith('.css')) {
      out.push(full);
    }
  }
  return out;
}

const componentFiles = collectCss(COMPONENTS_DIR);
const allComponentCss = componentFiles.map((f) => readFileSync(f, 'utf8')).join('\n');

test('les CSS de composants existent pour les 6 primitives', () => {
  for (const name of ['button', 'input', 'label', 'text', 'spinner', 'visually-hidden']) {
    assert.ok(
      componentFiles.some((f) => f.includes(`/${name}/`)),
      `CSS manquant pour ${name}`,
    );
  }
});

test('aucune couleur hexadécimale dans les CSS de composants', () => {
  const hex = allComponentCss.match(/#[0-9a-fA-F]{3,8}\b/g);
  assert.equal(hex, null, `hex trouvé : ${hex?.join(', ')}`);
});

test('les CSS consomment les variables --enistere-*', () => {
  assert.ok(allComponentCss.includes('var(--enistere-'));
});

test('aucun sélecteur global destructif', () => {
  const destructive = /(^|\n)\s*(\*|html|body|button|input|select|textarea|a|label|h1|h2|h3|p)\s*[{,]/;
  assert.ok(!destructive.test(allComponentCss), 'sélecteur global destructif détecté');
});

test('toutes les classes sont préfixées enistere-', () => {
  const classes = allComponentCss.match(/\.[a-zA-Z][a-zA-Z0-9_-]*/g) ?? [];
  for (const cls of classes) {
    assert.ok(cls.startsWith('.enistere-'), `classe non préfixée : ${cls}`);
  }
});

test('dark via variables (aucune règle [data-theme] dupliquée par composant)', () => {
  assert.ok(!allComponentCss.includes('[data-theme'));
});

test('accessibilité CSS : focus-visible, disabled, prefers-reduced-motion', () => {
  assert.ok(allComponentCss.includes(':focus-visible'));
  assert.ok(allComponentCss.includes(':disabled'));
  assert.ok(allComponentCss.includes('prefers-reduced-motion'));
});

test('styles.css agrège tokens (:root + dark) et composants', () => {
  const styles = readFileSync(STYLES_CSS, 'utf8');
  assert.match(styles, /:root\s*\{/);
  assert.match(styles, /\[data-theme="dark"\]\s*\{/);
  assert.ok(styles.includes('var(--enistere-'));
  assert.ok(styles.includes('.enistere-button--primary'));
  assert.ok(styles.includes('.enistere-input'));
});
