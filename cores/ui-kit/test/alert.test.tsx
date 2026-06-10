import './helpers/dom-setup.js';

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { cleanup, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';

import { Alert } from '../src/components/alert/alert.js';

afterEach(() => {
  cleanup();
});

const axeOptions = { rules: { region: { enabled: false } } } as const;

test('rend un message avec variante et contenu', () => {
  render(<Alert variant="success">Enregistré.</Alert>);
  const el = screen.getByText('Enregistré.').closest('.enistere-alert');
  assert.ok(el);
  assert.ok(el?.classList.contains('enistere-alert--success'));
});

test('rôle par défaut : info/success/warning → status, danger → alert', () => {
  render(
    <>
      <Alert variant="info">i</Alert>
      <Alert variant="warning">w</Alert>
      <Alert variant="danger">d</Alert>
    </>,
  );
  assert.equal(screen.getByText('i').closest('.enistere-alert')?.getAttribute('role'), 'status');
  assert.equal(screen.getByText('w').closest('.enistere-alert')?.getAttribute('role'), 'status');
  assert.equal(screen.getByText('d').closest('.enistere-alert')?.getAttribute('role'), 'alert');
});

test('rôle surchargeable explicitement', () => {
  render(<Alert variant="info" role="alert">urgent</Alert>);
  assert.equal(screen.getByText('urgent').closest('.enistere-alert')?.getAttribute('role'), 'alert');
});

test('titre optionnel rendu, glyphe décoratif (aria-hidden)', () => {
  const { container } = render(<Alert variant="warning" title="Attention">détail</Alert>);
  assert.ok(screen.getByText('Attention').classList.contains('enistere-alert__title'));
  assert.equal(container.querySelector('.enistere-alert__icon')?.getAttribute('aria-hidden'), 'true');
});

test('transmet className + attributs natifs ; forwardRef expose le div', () => {
  const ref = createRef<HTMLDivElement>();
  render(<Alert ref={ref} className="x" data-test="a">msg</Alert>);
  const el = screen.getByText('msg').closest('.enistere-alert') as HTMLElement;
  assert.ok(el.classList.contains('x'));
  assert.equal(el.getAttribute('data-test'), 'a');
  assert.equal(ref.current?.tagName, 'DIV');
});

test('aucune violation a11y (variantes + titre)', async () => {
  for (const variant of ['info', 'success', 'warning', 'danger'] as const) {
    const { container, unmount } = render(
      <Alert variant={variant} title="Titre">Contenu</Alert>,
    );
    const results = await axe(container, axeOptions);
    assert.equal(results.violations.length, 0, results.violations.map((v) => v.id).join(', '));
    unmount();
  }
});
