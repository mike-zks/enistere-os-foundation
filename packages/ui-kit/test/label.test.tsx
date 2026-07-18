import './helpers/dom-setup.js';

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { cleanup, render, screen } from '@testing-library/react';

import { Input } from '../src/components/input/input.js';
import { Label } from '../src/components/label/label.js';

afterEach(() => {
  cleanup();
});

test('rend un <label> natif avec htmlFor', () => {
  render(<Label htmlFor="email">Email</Label>);
  const lab = screen.getByText('Email');
  assert.equal(lab.tagName, 'LABEL');
  assert.equal(lab.getAttribute('for'), 'email');
});

test('required ajoute un indicateur décoratif (aria-hidden)', () => {
  render(<Label required>Nom</Label>);
  const required = document.querySelector('.enistere-label__required');
  assert.ok(required);
  assert.equal(required?.getAttribute('aria-hidden'), 'true');
});

test('association label ↔ input (accessible name)', () => {
  render(
    <>
      <Label htmlFor="champ">Champ</Label>
      <Input id="champ" />
    </>,
  );
  const input = screen.getByLabelText('Champ');
  assert.equal(input.tagName, 'INPUT');
});
