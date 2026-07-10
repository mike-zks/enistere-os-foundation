import './helpers/dom-setup.js';

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { cleanup, render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';

import { Skeleton } from '../src/components/skeleton/skeleton.js';

afterEach(() => {
  cleanup();
});

const axeOptions = { rules: { region: { enabled: false } } } as const;

test('rend un <div> avec la variante text par défaut', () => {
  const { container } = render(<Skeleton />);
  const el = container.querySelector('div.enistere-skeleton');
  assert.ok(el, 'élément enistere-skeleton absent');
  assert.ok(el?.classList.contains('enistere-skeleton--text'), 'variante text attendue');
});

test('aria-hidden="true" par défaut', () => {
  const { container } = render(<Skeleton />);
  const el = container.querySelector('.enistere-skeleton');
  assert.equal(el?.getAttribute('aria-hidden'), 'true');
});

test('préserve aria-hidden="true" même si une prop native tente de le modifier', () => {
  const { container } = render(<Skeleton aria-hidden="false" />);
  const el = container.querySelector('.enistere-skeleton');
  assert.equal(el?.getAttribute('aria-hidden'), 'true');
});

test('variante block applique la classe appropriée', () => {
  const { container } = render(<Skeleton variant="block" />);
  const el = container.querySelector('.enistere-skeleton');
  assert.ok(el?.classList.contains('enistere-skeleton--block'));
});

test('variante circle applique la classe appropriée', () => {
  const { container } = render(<Skeleton variant="circle" />);
  const el = container.querySelector('.enistere-skeleton');
  assert.ok(el?.classList.contains('enistere-skeleton--circle'));
});

test('transmet className et style', () => {
  const { container } = render(
    <Skeleton className="custom" style={{ width: '80px', height: '80px' }} />,
  );
  const el = container.querySelector('.enistere-skeleton') as HTMLElement | null;
  assert.ok(el?.classList.contains('custom'));
  assert.equal(el?.style.width, '80px');
  assert.equal(el?.style.height, '80px');
});

test('forwardRef expose le <div>', () => {
  const ref = createRef<HTMLDivElement>();
  render(<Skeleton ref={ref} />);
  assert.equal(ref.current?.tagName, 'DIV');
});

test('aucune violation a11y pour toutes les variantes', async () => {
  for (const variant of ['text', 'block', 'circle'] as const) {
    const { container, unmount } = render(<Skeleton variant={variant} />);
    const results = await axe(container, axeOptions);
    assert.equal(results.violations.length, 0, results.violations.map((v) => v.id).join(', '));
    unmount();
  }
});
