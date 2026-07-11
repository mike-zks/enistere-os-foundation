import './helpers/dom-setup.js';

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { cleanup, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';

import { EmptyState } from '../src/components/empty-state/empty-state.js';

afterEach(() => {
  cleanup();
});

const axeOptions = { rules: { region: { enabled: false } } } as const;

test('rend un div avec le titre', () => {
  const { container } = render(<EmptyState title="Aucun résultat" />);
  const el = container.querySelector('div.enistere-empty-state');
  assert.ok(el, 'élément enistere-empty-state absent');
  assert.ok(el?.querySelector('.enistere-empty-state__title'));
  assert.equal(el?.querySelector('.enistere-empty-state__title')?.textContent, 'Aucun résultat');
});

test('affiche la description quand fournie', () => {
  render(<EmptyState title="Aucun résultat" description="Essayez un autre filtre." />);
  assert.ok(screen.getByText('Essayez un autre filtre.'));
});

test("n'affiche pas de description quand absente", () => {
  const { container } = render(<EmptyState title="Aucun résultat" />);
  assert.equal(container.querySelector('.enistere-empty-state__description'), null);
});

test('affiche le slot action quand fourni', () => {
  render(<EmptyState title="Aucun résultat" action={<button>Créer</button>} />);
  assert.ok(screen.getByText('Créer'));
  assert.ok(document.querySelector('.enistere-empty-state__action'));
});

test("n'affiche pas le slot action quand absent", () => {
  const { container } = render(<EmptyState title="Aucun résultat" />);
  assert.equal(container.querySelector('.enistere-empty-state__action'), null);
});

test('transmet className et attributs natifs', () => {
  render(<EmptyState title="Vide" className="x" data-test="es" />);
  const el = document.querySelector('.enistere-empty-state');
  assert.ok(el?.classList.contains('x'));
  assert.equal(el?.getAttribute('data-test'), 'es');
});

test('forwardRef expose le div', () => {
  const ref = createRef<HTMLDivElement>();
  render(<EmptyState title="Vide" ref={ref} />);
  assert.equal(ref.current?.tagName, 'DIV');
});

test('aucune violation a11y', async () => {
  const { container } = render(
    <EmptyState
      title="Aucun résultat"
      description="Essayez un autre filtre."
      action={<button>Créer un élément</button>}
    />,
  );
  const results = await axe(container, axeOptions);
  assert.equal(results.violations.length, 0, results.violations.map((v) => v.id).join(', '));
});
