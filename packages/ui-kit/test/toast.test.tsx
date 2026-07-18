import './helpers/dom-setup.js';

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { cleanup, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { createRef } from 'react';

import { Toast, ToastRegion } from '../src/components/toast/toast.js';

afterEach(() => {
  cleanup();
});

const axeOptions = { rules: { region: { enabled: false } } } as const;

// ── Rendu de base ───────────────────────────────────────────────────────────

test('rend un div avec les classes de base', () => {
  const { container } = render(<Toast>Message</Toast>);
  const el = container.querySelector('.enistere-toast');
  assert.ok(el, 'classe enistere-toast absente');
  assert.ok(el?.classList.contains('enistere-toast--info'));
});

test('variante est appliquée comme classe', () => {
  const { container } = render(<Toast variant="danger">Erreur</Toast>);
  assert.ok(container.querySelector('.enistere-toast--danger'));
});

test('titre optionnel est rendu', () => {
  render(<Toast title="Titre">Contenu</Toast>);
  assert.ok(screen.getByText('Titre').classList.contains('enistere-toast__title'));
  assert.ok(screen.getByText('Contenu'));
});

test('sans titre, la balise titre est absente', () => {
  const { container } = render(<Toast>msg</Toast>);
  assert.equal(container.querySelector('.enistere-toast__title'), null);
});

// ── ARIA ─────────────────────────────────────────────────────────────────────

test('info/success/warning → role=status + aria-live=polite', () => {
  for (const variant of ['info', 'success', 'warning'] as const) {
    const { container, unmount } = render(<Toast variant={variant}>t</Toast>);
    const el = container.querySelector('.enistere-toast') as HTMLElement;
    assert.equal(el.getAttribute('role'), 'status', `role incorrect pour ${variant}`);
    assert.equal(el.getAttribute('aria-live'), 'polite', `aria-live incorrect pour ${variant}`);
    unmount();
  }
});

test('danger → role=alert + aria-live=assertive', () => {
  const { container } = render(<Toast variant="danger">t</Toast>);
  const el = container.querySelector('.enistere-toast') as HTMLElement;
  assert.equal(el.getAttribute('role'), 'alert');
  assert.equal(el.getAttribute('aria-live'), 'assertive');
});

test('aria-atomic="true" est présent', () => {
  const { container } = render(<Toast>t</Toast>);
  assert.equal(container.querySelector('.enistere-toast')?.getAttribute('aria-atomic'), 'true');
});

// ── Bouton de fermeture ───────────────────────────────────────────────────────

test('onDismiss fourni → bouton de fermeture rendu', () => {
  render(<Toast onDismiss={() => {}}>t</Toast>);
  assert.ok(screen.getByRole('button', { name: 'Fermer' }));
});

test('sans onDismiss → pas de bouton de fermeture', () => {
  render(<Toast>t</Toast>);
  assert.equal(screen.queryByRole('button'), null);
});

test('clic sur fermeture appelle onDismiss', async () => {
  let dismissed = false;
  render(<Toast onDismiss={() => (dismissed = true)}>t</Toast>);
  await userEvent.setup().click(screen.getByRole('button', { name: 'Fermer' }));
  assert.equal(dismissed, true);
});

test('dismissLabel personnalise le label accessible du bouton', () => {
  render(<Toast onDismiss={() => {}} dismissLabel="Masquer">t</Toast>);
  assert.ok(screen.getByRole('button', { name: 'Masquer' }));
});

// ── className / forwardRef ────────────────────────────────────────────────────

test('className supplémentaire est appliqué', () => {
  const { container } = render(<Toast className="x">t</Toast>);
  assert.ok(container.querySelector('.enistere-toast')?.classList.contains('x'));
});

test('forwardRef expose le nœud div', () => {
  const ref = createRef<HTMLDivElement>();
  render(<Toast ref={ref}>t</Toast>);
  assert.equal(ref.current?.tagName, 'DIV');
});

// ── ToastRegion ───────────────────────────────────────────────────────────────

test('ToastRegion rend un div positionné', () => {
  const { container } = render(<ToastRegion><Toast>msg</Toast></ToastRegion>);
  const region = container.querySelector('.enistere-toast-region');
  assert.ok(region);
  assert.ok(region?.classList.contains('enistere-toast-region--bottom-right'));
});

test('ToastRegion position personnalisée', () => {
  const { container } = render(<ToastRegion position="top-left"><Toast>msg</Toast></ToastRegion>);
  assert.ok(container.querySelector('.enistere-toast-region--top-left'));
});

test('ToastRegion a aria-label="Notifications"', () => {
  const { container } = render(<ToastRegion><Toast>msg</Toast></ToastRegion>);
  assert.equal(container.querySelector('.enistere-toast-region')?.getAttribute('aria-label'), 'Notifications');
});

test('ToastRegion forwardRef expose le nœud div', () => {
  const ref = createRef<HTMLDivElement>();
  render(<ToastRegion ref={ref}><Toast>t</Toast></ToastRegion>);
  assert.equal(ref.current?.tagName, 'DIV');
});

// ── Accessibilité ─────────────────────────────────────────────────────────────

test('aucune violation a11y (toutes variantes, avec/sans bouton)', async () => {
  for (const variant of ['info', 'success', 'warning', 'danger'] as const) {
    const { container, unmount } = render(
      <Toast variant={variant} title="Titre" onDismiss={() => {}}>
        Description du message.
      </Toast>,
    );
    const results = await axe(container, axeOptions);
    assert.equal(results.violations.length, 0, `${variant}: ${results.violations.map((v) => v.id).join(', ')}`);
    unmount();
  }
});

test('ToastRegion avec toasts — aucune violation a11y', async () => {
  const { container } = render(
    <ToastRegion>
      <Toast variant="success" title="Enregistré" onDismiss={() => {}}>
        Vos modifications ont été sauvegardées.
      </Toast>
      <Toast variant="danger" onDismiss={() => {}}>
        Une erreur est survenue.
      </Toast>
    </ToastRegion>,
  );
  const results = await axe(container, axeOptions);
  assert.equal(results.violations.length, 0, results.violations.map((v) => v.id).join(', '));
});
