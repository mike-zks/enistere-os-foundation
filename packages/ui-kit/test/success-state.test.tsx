import './helpers/dom-setup.js';

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { cleanup, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';

import { SuccessState } from '../src/components/success-state/success-state.js';

afterEach(() => {
  cleanup();
});

const axeOptions = { rules: { region: { enabled: false } } } as const;

test('rend un div avec le rôle status par défaut', () => {
  const { container } = render(<SuccessState title="Opération réussie" />);
  const el = container.querySelector('div.enistere-success-state');
  assert.ok(el, 'élément enistere-success-state absent');
  assert.equal(el?.getAttribute('role'), 'status');
});

test('affiche le titre', () => {
  render(<SuccessState title="Opération réussie" />);
  assert.ok(screen.getByText('Opération réussie'));
});

test('affiche le message quand fourni', () => {
  render(<SuccessState title="Succès" message="Vos modifications ont été enregistrées." />);
  assert.ok(screen.getByText('Vos modifications ont été enregistrées.'));
});

test("n'affiche pas de message quand absent", () => {
  const { container } = render(<SuccessState title="Succès" />);
  assert.equal(container.querySelector('.enistere-success-state__message'), null);
});

test('affiche le slot action quand fourni', () => {
  render(<SuccessState title="Succès" action={<button>Continuer</button>} />);
  assert.ok(screen.getByText('Continuer'));
  assert.ok(document.querySelector('.enistere-success-state__action'));
});

test("n'affiche pas le slot action quand absent", () => {
  const { container } = render(<SuccessState title="Succès" />);
  assert.equal(container.querySelector('.enistere-success-state__action'), null);
});

test('accepte un rôle surchargé', () => {
  const { container } = render(<SuccessState title="Succès" role="alert" />);
  assert.equal(container.querySelector('.enistere-success-state')?.getAttribute('role'), 'alert');
});

test('transmet className et attributs natifs', () => {
  render(<SuccessState title="Succès" className="x" data-test="ok" />);
  const el = document.querySelector('.enistere-success-state');
  assert.ok(el?.classList.contains('x'));
  assert.equal(el?.getAttribute('data-test'), 'ok');
});

test('forwardRef expose le div', () => {
  const ref = createRef<HTMLDivElement>();
  render(<SuccessState title="Succès" ref={ref} />);
  assert.equal(ref.current?.tagName, 'DIV');
});

test('aucune violation a11y', async () => {
  const { container } = render(
    <SuccessState
      title="Opération réussie"
      message="Vos modifications ont été enregistrées."
      action={<button>Continuer</button>}
    />,
  );
  const results = await axe(container, axeOptions);
  assert.equal(results.violations.length, 0, results.violations.map((v) => v.id).join(', '));
});
