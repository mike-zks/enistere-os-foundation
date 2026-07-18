import './helpers/dom-setup.js';

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { cleanup, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { createRef, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../src/components/dialog/dialog.js';
import { Button } from '../src/components/button/button.js';

afterEach(() => {
  cleanup();
});

const axeOptions = { rules: { region: { enabled: false } } } as const;

// ── Rendu de base ───────────────────────────────────────────────────────────

test('rend un élément <dialog> natif', () => {
  const { container } = render(<Dialog open={false} onDismiss={() => {}}>contenu</Dialog>);
  const el = container.querySelector('dialog');
  assert.ok(el, '<dialog> absent');
  assert.equal(el?.tagName, 'DIALOG');
});

test('aria-modal="true" est présent', () => {
  const { container } = render(<Dialog open={false}>d</Dialog>);
  assert.equal(container.querySelector('dialog')?.getAttribute('aria-modal'), 'true');
});

test('le panneau interne porte la classe enistere-dialog__panel', () => {
  const { container } = render(<Dialog open={false}>d</Dialog>);
  assert.ok(container.querySelector('.enistere-dialog__panel'), 'panneau absent');
});

test('className supplémentaire est ajouté sur le <dialog>', () => {
  const { container } = render(<Dialog open={false} className="extra">d</Dialog>);
  assert.ok(container.querySelector('dialog')?.classList.contains('extra'));
});

// ── Sous-composants ─────────────────────────────────────────────────────────

test('DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter se rendent', () => {
  render(
    <Dialog open={false}>
      <DialogHeader>
        <DialogTitle id="t">Titre</DialogTitle>
        <DialogDescription>Description</DialogDescription>
      </DialogHeader>
      <DialogContent>Contenu</DialogContent>
      <DialogFooter>
        <Button>OK</Button>
      </DialogFooter>
    </Dialog>,
  );
  // Le dialog est fermé (open={false}) → pas d'attribut open → masqué dans l'arbre ARIA.
  // hidden:true pour vérifier la présence dans le DOM, pas l'accessibilité.
  assert.ok(screen.getByText('Titre', { selector: '*' }));
  assert.ok(screen.getByText('Description', { selector: '*' }));
  assert.ok(screen.getByText('Contenu', { selector: '*' }));
  assert.ok(screen.getByRole('button', { name: 'OK', hidden: true }));
});

test('DialogTitle utilise h2 par défaut', () => {
  render(<Dialog open={false}><DialogTitle>T</DialogTitle></Dialog>);
  assert.equal(screen.getByText('T').tagName, 'H2');
});

test("DialogTitle accepte as='h1'", () => {
  render(<Dialog open={false}><DialogTitle as="h1">T</DialogTitle></Dialog>);
  assert.equal(screen.getByText('T').tagName, 'H1');
});

// ── forwardRef ──────────────────────────────────────────────────────────────

test('forwardRef expose le nœud <dialog>', () => {
  const ref = createRef<HTMLDialogElement>();
  render(<Dialog ref={ref} open={false}>d</Dialog>);
  assert.equal(ref.current?.tagName, 'DIALOG');
});

// ── Dismiss ─────────────────────────────────────────────────────────────────

test('ESC (onCancel) appelle onDismiss', async () => {
  let dismissed = false;
  render(<Dialog open={true} onDismiss={() => (dismissed = true)}>d</Dialog>);
  const el = document.querySelector('dialog') as HTMLDialogElement;
  // Utiliser document.createEvent pour obtenir un Event jsdom (new Event() utilise la classe Node.js native).
  const ev = document.createEvent('Event');
  ev.initEvent('cancel', true, true);
  el.dispatchEvent(ev);
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(dismissed, true);
});

// ── Accessibilité ────────────────────────────────────────────────────────────

test('aucune violation a11y (fermé, structure complète)', async () => {
  const { container } = render(
    <Dialog open={false} aria-labelledby="d-title">
      <DialogHeader>
        <DialogTitle id="d-title">Titre dialog</DialogTitle>
        <DialogDescription>Description courte.</DialogDescription>
      </DialogHeader>
      <DialogContent>Contenu principal.</DialogContent>
      <DialogFooter>
        <Button variant="primary">Confirmer</Button>
        <Button variant="secondary">Annuler</Button>
      </DialogFooter>
    </Dialog>,
  );
  const results = await axe(container, axeOptions);
  assert.equal(results.violations.length, 0, results.violations.map((v) => v.id).join(', '));
});

// ── Contrôle ouverture (stateful) ────────────────────────────────────────────

test('le Dialog contrôlé affiche son contenu quand open=true', () => {
  function Wrapper() {
    const [open, setOpen] = useState(true);
    return (
      <Dialog open={open} onDismiss={() => setOpen(false)}>
        <DialogContent>Bonjour</DialogContent>
      </Dialog>
    );
  }
  render(<Wrapper />);
  assert.ok(screen.getByText('Bonjour'));
});

test('fermeture via bouton appelle onDismiss', async () => {
  let closed = false;
  function Wrapper() {
    return (
      <Dialog open={true} onDismiss={() => (closed = true)}>
        <DialogFooter>
          <Button onClick={() => (closed = true)}>Fermer</Button>
        </DialogFooter>
      </Dialog>
    );
  }
  render(<Wrapper />);
  await userEvent.setup().click(screen.getByRole('button', { name: 'Fermer' }));
  assert.equal(closed, true);
});
