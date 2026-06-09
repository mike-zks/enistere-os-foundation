import './helpers/dom-setup.js';

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { cleanup, render, screen } from '@testing-library/react';

import { VisuallyHidden } from '../src/components/visually-hidden/visually-hidden.js';

afterEach(() => {
  cleanup();
});

test('contenu présent dans le DOM + classe appliquée', () => {
  render(<VisuallyHidden>caché</VisuallyHidden>);
  const el = screen.getByText('caché');
  assert.ok(el.classList.contains('enistere-visually-hidden'));
});

test('ne masque pas via display:none / visibility:hidden inline', () => {
  render(<VisuallyHidden>x</VisuallyHidden>);
  const el = screen.getByText('x');
  assert.equal(el.getAttribute('style'), null);
});

test('transmet les attributs (ex. id)', () => {
  render(<VisuallyHidden id="vh">y</VisuallyHidden>);
  assert.equal(screen.getByText('y').getAttribute('id'), 'vh');
});
