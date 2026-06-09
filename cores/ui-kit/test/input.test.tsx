import './helpers/dom-setup.js';

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { cleanup, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';

import { Input } from '../src/components/input/input.js';

afterEach(() => {
  cleanup();
});

test('rend un <input>, type=text par défaut', () => {
  render(<Input aria-label="email" />);
  const el = screen.getByLabelText('email');
  assert.equal(el.tagName, 'INPUT');
  assert.equal(el.getAttribute('type'), 'text');
});

test('transmet les attributs natifs + taille token + className', () => {
  render(<Input aria-label="n" name="firstname" placeholder="Jean" required size="lg" className="x" />);
  const el = screen.getByLabelText('n');
  assert.equal(el.getAttribute('name'), 'firstname');
  assert.equal(el.getAttribute('placeholder'), 'Jean');
  assert.equal(el.hasAttribute('required'), true);
  assert.ok(el.classList.contains('enistere-input--lg'));
  assert.ok(el.classList.contains('x'));
});

test('invalid → aria-invalid + classe', () => {
  render(<Input aria-label="e" invalid />);
  const el = screen.getByLabelText('e');
  assert.equal(el.getAttribute('aria-invalid'), 'true');
  assert.ok(el.classList.contains('enistere-input--invalid'));
});

test('disabled', () => {
  render(<Input aria-label="d" disabled />);
  assert.equal((screen.getByLabelText('d') as HTMLInputElement).disabled, true);
});

test('saisie utilisateur', async () => {
  render(<Input aria-label="s" />);
  const el = screen.getByLabelText('s') as HTMLInputElement;
  await userEvent.setup().type(el, 'abc');
  assert.equal(el.value, 'abc');
});

test('forwardRef expose le nœud input', () => {
  const ref = createRef<HTMLInputElement>();
  render(<Input ref={ref} aria-label="r" />);
  assert.equal(ref.current?.tagName, 'INPUT');
});
