import './helpers/dom-setup.js';

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { cleanup, render, screen } from '@testing-library/react';

import { Spinner } from '../src/components/spinner/spinner.js';

afterEach(() => {
  cleanup();
});

test('autonome : role status + libellé accessible', () => {
  render(<Spinner label="Chargement" />);
  const el = screen.getByRole('status');
  assert.ok(el.classList.contains('enistere-spinner'));
  assert.ok(el.textContent?.includes('Chargement'));
});

test('décoratif : aria-hidden, pas de role status', () => {
  render(<Spinner decorative />);
  assert.equal(document.querySelector('[role="status"]'), null);
  const el = document.querySelector('.enistere-spinner');
  assert.equal(el?.getAttribute('aria-hidden'), 'true');
});

test('taille appliquée', () => {
  render(<Spinner size="lg" />);
  assert.ok(document.querySelector('.enistere-spinner--lg'));
});

test('indicateur visuel toujours aria-hidden', () => {
  render(<Spinner label="x" />);
  const indicator = document.querySelector('.enistere-spinner__indicator');
  assert.equal(indicator?.getAttribute('aria-hidden'), 'true');
});
