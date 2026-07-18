import './helpers/dom-setup.js';

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { cleanup, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';

import { LoadingState } from '../src/components/loading-state/loading-state.js';

afterEach(() => {
  cleanup();
});

const axeOptions = { rules: { region: { enabled: false } } } as const;

test('rend un div avec le rôle status par défaut', () => {
  const { container } = render(<LoadingState />);
  const el = container.querySelector('div.enistere-loading-state');
  assert.ok(el, 'élément enistere-loading-state absent');
  assert.equal(el?.getAttribute('role'), 'status');
});

test('contient le spinner', () => {
  const { container } = render(<LoadingState />);
  assert.ok(container.querySelector('.enistere-spinner'), 'spinner absent');
});

test('affiche le message quand fourni', () => {
  render(<LoadingState message="Chargement des données…" />);
  assert.ok(screen.getByText('Chargement des données…'));
});

test("n'affiche pas de message quand absent", () => {
  const { container } = render(<LoadingState />);
  assert.equal(container.querySelector('.enistere-loading-state__message'), null);
});

test('transmet className et attributs natifs', () => {
  render(<LoadingState className="x" data-test="ls" />);
  const el = document.querySelector('.enistere-loading-state');
  assert.ok(el?.classList.contains('x'));
  assert.equal(el?.getAttribute('data-test'), 'ls');
});

test('forwardRef expose le div', () => {
  const ref = createRef<HTMLDivElement>();
  render(<LoadingState ref={ref} />);
  assert.equal(ref.current?.tagName, 'DIV');
});

test('aucune violation a11y', async () => {
  const { container } = render(<LoadingState message="Veuillez patienter…" />);
  const results = await axe(container, axeOptions);
  assert.equal(results.violations.length, 0, results.violations.map((v) => v.id).join(', '));
});
