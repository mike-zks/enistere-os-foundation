import './helpers/dom-setup.js';

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { cleanup, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';

import { Badge } from '../src/components/badge/badge.js';

afterEach(() => {
  cleanup();
});

const axeOptions = { rules: { region: { enabled: false } } } as const;

test('rend un <span> avec la variante et la taille par défaut', () => {
  const { container } = render(<Badge>Actif</Badge>);
  const el = container.querySelector('span.enistere-badge');
  assert.ok(el, 'élément enistere-badge absent');
  assert.ok(el?.classList.contains('enistere-badge--neutral'), 'variante neutral attendue');
  assert.ok(el?.classList.contains('enistere-badge--md'), 'taille md attendue');
  assert.equal(el?.textContent, 'Actif');
});

test('applique la variante et la taille passées en props', () => {
  const { container } = render(<Badge variant="success" size="sm">OK</Badge>);
  const el = container.querySelector('span.enistere-badge');
  assert.ok(el?.classList.contains('enistere-badge--success'));
  assert.ok(el?.classList.contains('enistere-badge--sm'));
});

test('applique toutes les variantes sans erreur', () => {
  for (const variant of ['neutral', 'info', 'success', 'warning', 'danger'] as const) {
    const { container, unmount } = render(<Badge variant={variant}>{variant}</Badge>);
    const el = container.querySelector('span.enistere-badge');
    assert.ok(el?.classList.contains(`enistere-badge--${variant}`), `variante ${variant} manquante`);
    unmount();
  }
});

test('transmet className et attributs natifs', () => {
  render(<Badge className="x" data-test="b">Pending</Badge>);
  const el = screen.getByText('Pending');
  assert.ok(el.classList.contains('x'));
  assert.equal(el.getAttribute('data-test'), 'b');
});

test('forwardRef expose le <span>', () => {
  const ref = createRef<HTMLSpanElement>();
  render(<Badge ref={ref}>ref</Badge>);
  assert.equal(ref.current?.tagName, 'SPAN');
});

test('aucune violation a11y pour chaque variante', async () => {
  for (const variant of ['neutral', 'info', 'success', 'warning', 'danger'] as const) {
    const { container, unmount } = render(
      <Badge variant={variant}>{variant}</Badge>,
    );
    const results = await axe(container, axeOptions);
    assert.equal(results.violations.length, 0, results.violations.map((v) => v.id).join(', '));
    unmount();
  }
});
