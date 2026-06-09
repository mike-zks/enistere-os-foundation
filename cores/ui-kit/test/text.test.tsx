import './helpers/dom-setup.js';

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { cleanup, render, screen } from '@testing-library/react';
import { createRef } from 'react';

import { Text } from '../src/components/text/text.js';

afterEach(() => {
  cleanup();
});

test('rend <p> par défaut avec variante body + ton default', () => {
  render(<Text>Bonjour</Text>);
  const el = screen.getByText('Bonjour');
  assert.equal(el.tagName, 'P');
  assert.ok(el.classList.contains('enistere-text--body'));
  assert.ok(el.classList.contains('enistere-text--tone-default'));
});

test('as choisit l’élément HTML (h1)', () => {
  render(
    <Text as="h1" variant="display">
      Titre
    </Text>,
  );
  const el = screen.getByRole('heading', { level: 1, name: 'Titre' });
  assert.equal(el.tagName, 'H1');
  assert.ok(el.classList.contains('enistere-text--display'));
});

test('ton appliqué', () => {
  render(<Text tone="danger">Err</Text>);
  assert.ok(screen.getByText('Err').classList.contains('enistere-text--tone-danger'));
});

test('aucun style inline magique', () => {
  render(<Text>Z</Text>);
  assert.equal(screen.getByText('Z').getAttribute('style'), null);
});

test('forwardRef expose le nœud', () => {
  const ref = createRef<HTMLElement>();
  render(<Text ref={ref}>R</Text>);
  assert.equal(ref.current?.tagName, 'P');
});
