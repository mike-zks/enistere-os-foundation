import './helpers/dom-setup.js';

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { cleanup, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { createRef } from 'react';

import { Label } from '../src/components/label/label.js';
import { Select } from '../src/components/select/select.js';

afterEach(() => {
  cleanup();
});

const axeOptions = { rules: { region: { enabled: false } } } as const;

// ── Rendu de base ───────────────────────────────────────────────────────────

test('rend un <select> natif', () => {
  render(
    <Select>
      <option value="a">A</option>
    </Select>,
  );
  assert.ok(screen.getByRole('combobox'));
});

test('wrapper <span> porte les classes enistere-select-wrapper et taille', () => {
  const { container } = render(<Select size="lg"><option>x</option></Select>);
  const wrapper = container.querySelector('span');
  assert.ok(wrapper?.classList.contains('enistere-select-wrapper'));
  assert.ok(wrapper?.classList.contains('enistere-select-wrapper--lg'));
});

test('le <select> interne porte enistere-select et la taille', () => {
  const { container } = render(<Select size="sm"><option>x</option></Select>);
  const sel = container.querySelector('select');
  assert.ok(sel?.classList.contains('enistere-select'));
  assert.ok(sel?.classList.contains('enistere-select--sm'));
});

test('className est appliqué sur le wrapper, pas sur le select', () => {
  const { container } = render(<Select className="outer"><option>x</option></Select>);
  const wrapper = container.querySelector('span');
  const sel = container.querySelector('select');
  assert.ok(wrapper?.classList.contains('outer'));
  assert.ok(!sel?.classList.contains('outer'));
});

// ── Invalid ──────────────────────────────────────────────────────────────────

test('invalid → aria-invalid + classe --invalid sur le select', () => {
  const { container } = render(<Select invalid><option>x</option></Select>);
  const sel = container.querySelector('select') as HTMLSelectElement;
  assert.equal(sel.getAttribute('aria-invalid'), 'true');
  assert.ok(sel.classList.contains('enistere-select--invalid'));
});

test('pas de aria-invalid quand invalid=false', () => {
  const { container } = render(<Select><option>x</option></Select>);
  assert.equal(container.querySelector('select')?.getAttribute('aria-invalid'), null);
});

// ── Disabled ─────────────────────────────────────────────────────────────────

test('disabled est transmis au <select>', () => {
  render(<Select disabled><option>x</option></Select>);
  assert.equal((screen.getByRole('combobox') as HTMLSelectElement).disabled, true);
});

// ── Options ──────────────────────────────────────────────────────────────────

test('les options enfants sont rendues', () => {
  render(
    <Select>
      <option value="">— choisir —</option>
      <option value="ci">Côte d'Ivoire</option>
      <option value="sn">Sénégal</option>
    </Select>,
  );
  const sel = screen.getByRole('combobox') as HTMLSelectElement;
  assert.equal(sel.options.length, 3);
  assert.equal(sel.options[1]?.value, 'ci');
});

// ── Interaction ───────────────────────────────────────────────────────────────

test('onChange est appelé au changement de valeur', async () => {
  let changed = '';
  render(
    <Select onChange={(e) => (changed = e.target.value)}>
      <option value="a">A</option>
      <option value="b">B</option>
    </Select>,
  );
  await userEvent.setup().selectOptions(screen.getByRole('combobox'), 'b');
  assert.equal(changed, 'b');
});

// ── forwardRef ────────────────────────────────────────────────────────────────

test('forwardRef expose le nœud <select>', () => {
  const ref = createRef<HTMLSelectElement>();
  render(
    <Select ref={ref}>
      <option value="x">x</option>
    </Select>,
  );
  assert.equal(ref.current?.tagName, 'SELECT');
});

// ── Accessibilité ─────────────────────────────────────────────────────────────

test('associé à un Label — aucune violation a11y', async () => {
  const { container } = render(
    <>
      <Label htmlFor="pays" required>Pays</Label>
      <Select id="pays">
        <option value="">— choisir —</option>
        <option value="ci">Côte d'Ivoire</option>
      </Select>
    </>,
  );
  const results = await axe(container, axeOptions);
  assert.equal(results.violations.length, 0, results.violations.map((v) => v.id).join(', '));
});

test("Select invalide avec message d'erreur — aucune violation a11y", async () => {
  const { container } = render(
    <div>
      <Label htmlFor="p">Pays</Label>
      <Select id="p" invalid aria-describedby="p-err">
        <option value="">— choisir —</option>
      </Select>
      <p id="p-err" role="alert">Champ requis</p>
    </div>,
  );
  const results = await axe(container, axeOptions);
  assert.equal(results.violations.length, 0, results.violations.map((v) => v.id).join(', '));
});
