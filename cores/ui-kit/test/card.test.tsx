import './helpers/dom-setup.js';

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { cleanup, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../src/components/card/card.js';

afterEach(() => {
  cleanup();
});

const axeOptions = { rules: { region: { enabled: false } } } as const;

test('Card : div générique, sans rôle imposé, className + ref', () => {
  const ref = createRef<HTMLDivElement>();
  const { container } = render(
    <Card ref={ref} className="x" data-test="c">
      contenu
    </Card>,
  );
  const el = container.querySelector('.enistere-card') as HTMLElement;
  assert.equal(el.tagName, 'DIV');
  assert.equal(el.getAttribute('role'), null, 'aucun rôle imposé');
  assert.ok(el.classList.contains('x'));
  assert.equal(el.getAttribute('data-test'), 'c');
  assert.equal(ref.current?.tagName, 'DIV');
});

test('CardTitle : aucun titre imposé (p par défaut), niveau configurable via as', () => {
  const { rerender } = render(<CardTitle>Titre</CardTitle>);
  assert.equal(screen.getByText('Titre').tagName, 'P');
  rerender(<CardTitle as="h2">Titre</CardTitle>);
  assert.equal(screen.getByText('Titre').tagName, 'H2');
});

test('slots : header/description/content/footer rendus avec leurs classes', () => {
  const { container } = render(
    <Card>
      <CardHeader>
        <CardTitle as="h3">T</CardTitle>
        <CardDescription>desc</CardDescription>
      </CardHeader>
      <CardContent>body</CardContent>
      <CardFooter>foot</CardFooter>
    </Card>,
  );
  assert.ok(container.querySelector('.enistere-card__header'));
  assert.ok(container.querySelector('.enistere-card__content'));
  assert.ok(container.querySelector('.enistere-card__footer'));
  assert.equal(screen.getByText('desc').tagName, 'P');
  assert.ok(screen.getByText('desc').classList.contains('enistere-card__description'));
});

test('aucune violation a11y', async () => {
  const { container } = render(
    <Card>
      <CardHeader>
        <CardTitle as="h2">Titre</CardTitle>
        <CardDescription>Description</CardDescription>
      </CardHeader>
      <CardContent>Contenu</CardContent>
      <CardFooter>Pied</CardFooter>
    </Card>,
  );
  const results = await axe(container, axeOptions);
  assert.equal(results.violations.length, 0, results.violations.map((v) => v.id).join(', '));
});
