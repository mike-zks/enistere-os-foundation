import './helpers/dom-setup.js';

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { cleanup, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import {
  FormField,
  FormFieldDescription,
  FormFieldError,
  FormFieldLabel,
} from '../src/components/form-field/form-field.js';
import { Input } from '../src/components/input/input.js';

afterEach(() => {
  cleanup();
});

const axeOptions = { rules: { region: { enabled: false } } } as const;

function renderField() {
  return render(
    <FormField>
      <FormFieldLabel htmlFor="email" required>
        E-mail
      </FormFieldLabel>
      <Input id="email" aria-describedby="email-help email-error" aria-invalid />
      <FormFieldDescription id="email-help">Format pro.</FormFieldDescription>
      <FormFieldError id="email-error">Adresse invalide.</FormFieldError>
    </FormField>,
  );
}

test('label associé au champ (htmlFor/id), description + erreur reliées par aria-describedby', () => {
  renderField();
  const input = screen.getByLabelText(/E-mail/) as HTMLInputElement; // prouve l'association label/champ
  assert.equal(input.id, 'email');
  assert.equal(input.getAttribute('aria-describedby'), 'email-help email-error');
  assert.equal(input.getAttribute('aria-invalid'), 'true');
  assert.equal(screen.getByText('Format pro.').id, 'email-help');
  assert.equal(screen.getByText('Adresse invalide.').id, 'email-error');
});

test('composition explicite : aucune injection magique (le champ garde ses props)', () => {
  renderField();
  // L'Input conserve exactement ses attributs (FormField ne clone pas / n'écrase pas les enfants).
  const input = screen.getByLabelText(/E-mail/);
  assert.ok(input.classList.contains('enistere-input'));
  assert.ok(screen.getByText('E-mail').classList.contains('enistere-form-field__label'));
  assert.ok(screen.getByText('Adresse invalide.').classList.contains('enistere-form-field__error'));
});

test('FormFieldLabel rend un <label> (primitive Label réutilisée)', () => {
  renderField();
  assert.equal(screen.getByText('E-mail').tagName, 'LABEL');
});

test('aucune violation a11y', async () => {
  const { container } = renderField();
  const results = await axe(container, axeOptions);
  assert.equal(results.violations.length, 0, results.violations.map((v) => v.id).join(', '));
});
