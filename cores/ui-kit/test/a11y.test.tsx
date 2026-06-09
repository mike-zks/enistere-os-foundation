import './helpers/dom-setup.js';

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { cleanup, render } from '@testing-library/react';
import { axe } from 'jest-axe';

import { Button, Input, Label, Spinner } from '../src/index.js';

afterEach(() => {
  cleanup();
});

// `region` est une règle de niveau page — non pertinente pour un fragment de composant.
const axeOptions = { rules: { region: { enabled: false } } } as const;

async function expectNoViolations(container: Element): Promise<void> {
  const results = await axe(container, axeOptions);
  assert.equal(
    results.violations.length,
    0,
    `violations: ${results.violations.map((v) => v.id).join(', ')}`,
  );
}

test('Button — aucune violation a11y évidente', async () => {
  const { container } = render(<Button>Valider</Button>);
  await expectNoViolations(container);
});

test('Input associé à un Label — aucune violation', async () => {
  const { container } = render(
    <>
      <Label htmlFor="e">Email</Label>
      <Input id="e" />
    </>,
  );
  await expectNoViolations(container);
});

test('Spinner autonome — aucune violation', async () => {
  const { container } = render(<Spinner label="Chargement" />);
  await expectNoViolations(container);
});
