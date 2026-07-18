import './helpers/dom-setup.js';

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { cleanup, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';

import { Button } from '../src/components/button/button.js';

afterEach(() => {
  cleanup();
});

test('rend un <button> natif, type=button par défaut', () => {
  render(<Button>Enregistrer</Button>);
  const btn = screen.getByRole('button', { name: 'Enregistrer' });
  assert.equal(btn.tagName, 'BUTTON');
  assert.equal(btn.getAttribute('type'), 'button');
});

test('applique variante, taille et className', () => {
  render(
    <Button variant="danger" size="lg" className="extra">
      D
    </Button>,
  );
  const btn = screen.getByRole('button', { name: 'D' });
  assert.ok(btn.classList.contains('enistere-button--danger'));
  assert.ok(btn.classList.contains('enistere-button--lg'));
  assert.ok(btn.classList.contains('extra'));
});

test('transmet les attributs natifs (submit, name, form)', () => {
  render(
    <Button type="submit" name="save" form="f">
      S
    </Button>,
  );
  const btn = screen.getByRole('button', { name: 'S' });
  assert.equal(btn.getAttribute('type'), 'submit');
  assert.equal(btn.getAttribute('name'), 'save');
  assert.equal(btn.getAttribute('form'), 'f');
});

test('clic appelle onClick quand actif', async () => {
  let clicks = 0;
  render(<Button onClick={() => (clicks += 1)}>Go</Button>);
  await userEvent.setup().click(screen.getByRole('button', { name: 'Go' }));
  assert.equal(clicks, 1);
});

test('disabled : bouton réellement désactivé', () => {
  render(<Button disabled>X</Button>);
  assert.equal((screen.getByRole('button', { name: 'X' }) as HTMLButtonElement).disabled, true);
});

test('loading : disabled + aria-busy + spinner décoratif + texte accessible', () => {
  render(
    <Button loading loadingText="Envoi…">
      Envoyer
    </Button>,
  );
  const btn = screen.getByRole('button', { name: 'Envoi…' }) as HTMLButtonElement;
  assert.equal(btn.disabled, true);
  assert.equal(btn.getAttribute('aria-busy'), 'true');
  assert.equal(btn.querySelector('[role="status"]'), null, 'spinner doit être décoratif (pas role status)');
  assert.ok(btn.querySelector('.enistere-button__spinner'));
});

test('forwardRef expose le nœud bouton', () => {
  const ref = createRef<HTMLButtonElement>();
  render(<Button ref={ref}>R</Button>);
  assert.equal(ref.current?.tagName, 'BUTTON');
});
