import './helpers/dom-setup.js';

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { cleanup, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';

import { Divider } from '../src/components/divider/divider.js';

afterEach(() => {
  cleanup();
});

const axeOptions = { rules: { region: { enabled: false } } } as const;

test('horizontal par défaut : aria-hidden, classe appropriée', () => {
  const { container } = render(<Divider />);
  const el = container.querySelector('.enistere-divider');
  assert.ok(el, 'élément enistere-divider absent');
  assert.ok(el?.classList.contains('enistere-divider--horizontal'));
  assert.equal(el?.getAttribute('aria-hidden'), 'true');
  assert.equal(el?.getAttribute('role'), null);
});

test('vertical : classe et aria-hidden', () => {
  const { container } = render(<Divider orientation="vertical" />);
  const el = container.querySelector('.enistere-divider');
  assert.ok(el?.classList.contains('enistere-divider--vertical'));
  assert.equal(el?.getAttribute('aria-hidden'), 'true');
});

test('avec label : role=separator, aria-orientation, label visible', () => {
  render(<Divider label="OU" />);
  const el = document.querySelector('.enistere-divider');
  assert.equal(el?.getAttribute('role'), 'separator');
  assert.equal(el?.getAttribute('aria-orientation'), 'horizontal');
  assert.ok(screen.getByText('OU').classList.contains('enistere-divider__label'));
});

test('avec label vertical : aria-orientation=vertical', () => {
  render(<Divider orientation="vertical" label="·" />);
  const el = document.querySelector('.enistere-divider');
  assert.equal(el?.getAttribute('aria-orientation'), 'vertical');
});

test('avec label : deux lignes décoratives présentes', () => {
  const { container } = render(<Divider label="ET" />);
  const lines = container.querySelectorAll('.enistere-divider__line');
  assert.equal(lines.length, 2);
  for (const line of lines) {
    assert.equal(line.getAttribute('aria-hidden'), 'true');
  }
});

test('transmet className et attributs natifs', () => {
  const { container } = render(<Divider className="extra" data-test="d" />);
  const el = container.querySelector('.enistere-divider');
  assert.ok(el?.classList.contains('extra'));
  assert.equal(el?.getAttribute('data-test'), 'd');
});

test('préserve le mode décoratif par défaut même si aria-hidden est passé', () => {
  const { container } = render(<Divider aria-hidden="false" />);
  const el = container.querySelector('.enistere-divider');
  assert.equal(el?.getAttribute('aria-hidden'), 'true');
  assert.equal(el?.getAttribute('role'), null);
});

test('préserve le rôle sémantique quand un label est fourni', () => {
  render(<Divider label="OU" role="presentation" aria-orientation="vertical" />);
  const el = document.querySelector('.enistere-divider');
  assert.equal(el?.getAttribute('role'), 'separator');
  assert.equal(el?.getAttribute('aria-orientation'), 'horizontal');
});

test('forwardRef expose le <div>', () => {
  const ref = createRef<HTMLDivElement>();
  render(<Divider ref={ref} />);
  assert.equal(ref.current?.tagName, 'DIV');
});

test('aucune violation a11y — décoratif horizontal', async () => {
  const { container } = render(<Divider />);
  const results = await axe(container, axeOptions);
  assert.equal(results.violations.length, 0, results.violations.map((v) => v.id).join(', '));
});

test('aucune violation a11y — séparateur avec label', async () => {
  const { container } = render(<Divider label="OU" />);
  const results = await axe(container, axeOptions);
  assert.equal(results.violations.length, 0, results.violations.map((v) => v.id).join(', '));
});
