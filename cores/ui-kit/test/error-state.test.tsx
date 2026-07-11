import './helpers/dom-setup.js';

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { cleanup, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';

import { ErrorState } from '../src/components/error-state/error-state.js';

afterEach(() => {
  cleanup();
});

const axeOptions = { rules: { region: { enabled: false } } } as const;

test('rend un div avec le rôle alert par défaut', () => {
  const { container } = render(<ErrorState title="Une erreur est survenue" />);
  const el = container.querySelector('div.enistere-error-state');
  assert.ok(el, 'élément enistere-error-state absent');
  assert.equal(el?.getAttribute('role'), 'alert');
});

test('affiche le titre', () => {
  render(<ErrorState title="Une erreur est survenue" />);
  assert.ok(screen.getByText('Une erreur est survenue'));
});

test('affiche le message quand fourni', () => {
  render(<ErrorState title="Erreur" message="Veuillez réessayer." />);
  assert.ok(screen.getByText('Veuillez réessayer.'));
});

test("n'affiche pas de message quand absent", () => {
  const { container } = render(<ErrorState title="Erreur" />);
  assert.equal(container.querySelector('.enistere-error-state__message'), null);
});

test('affiche le slot action quand fourni', () => {
  render(<ErrorState title="Erreur" action={<button>Réessayer</button>} />);
  assert.ok(screen.getByText('Réessayer'));
  assert.ok(document.querySelector('.enistere-error-state__action'));
});

test("n'affiche pas le slot action quand absent", () => {
  const { container } = render(<ErrorState title="Erreur" />);
  assert.equal(container.querySelector('.enistere-error-state__action'), null);
});

test('accepte un rôle surchargé', () => {
  const { container } = render(<ErrorState title="Erreur" role="status" />);
  assert.equal(container.querySelector('.enistere-error-state')?.getAttribute('role'), 'status');
});

test('transmet className et attributs natifs', () => {
  render(<ErrorState title="Erreur" className="x" data-test="err" />);
  const el = document.querySelector('.enistere-error-state');
  assert.ok(el?.classList.contains('x'));
  assert.equal(el?.getAttribute('data-test'), 'err');
});

test('forwardRef expose le div', () => {
  const ref = createRef<HTMLDivElement>();
  render(<ErrorState title="Erreur" ref={ref} />);
  assert.equal(ref.current?.tagName, 'DIV');
});

test('aucune violation a11y', async () => {
  const { container } = render(
    <ErrorState
      title="Une erreur est survenue"
      message="Veuillez réessayer ultérieurement."
      action={<button>Réessayer</button>}
    />,
  );
  const results = await axe(container, axeOptions);
  assert.equal(results.violations.length, 0, results.violations.map((v) => v.id).join(', '));
});
