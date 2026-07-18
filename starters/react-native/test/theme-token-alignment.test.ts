/**
 * RN35 — Token alignment proof: the mobile theme tokens are verbatim from the
 * UI Kit generated tokens (packages/ui-kit/generated/typescript/tokens.ts,
 * tokensVersion 0.1.0). Any drift here is a regression.
 *
 * Run via `node --test` (pure Node, no React/RN needed).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  a11y,
  darkTheme,
  lightTheme,
  radius,
  resolveTheme,
  spacing,
  typography,
} from '../src/theme/tokens';

// ---------------------------------------------------------------------------
// Spacing — mirrors UI Kit primitives.spacing (named scale)
// ---------------------------------------------------------------------------
test('spacing tokens match UI Kit primitive scale', () => {
  assert.equal(spacing.xs, 4);   // spacing["1"]
  assert.equal(spacing.sm, 8);   // spacing["2"]
  assert.equal(spacing.md, 16);  // spacing["4"]
  assert.equal(spacing.lg, 24);  // spacing["6"]
  assert.equal(spacing.xl, 32);  // spacing["8"]
  assert.equal(spacing.xxl, 48); // spacing["12"]
});

// ---------------------------------------------------------------------------
// Radius — mirrors UI Kit primitives.radius
// ---------------------------------------------------------------------------
test('radius tokens match UI Kit primitive scale', () => {
  assert.equal(radius.sm, 4);
  assert.equal(radius.md, 8);
  assert.equal(radius.lg, 12);
  assert.equal(radius.pill, 9999); // UI Kit radius.full
});

// ---------------------------------------------------------------------------
// Typography — fontSize and fontWeight from UI Kit semanticTypography;
// lineHeight = ratio × fontSize (1.2 for heading, 1.5 for others)
// ---------------------------------------------------------------------------
test('typography heading matches UI Kit semanticTypography.heading', () => {
  assert.equal(typography.heading.fontSize, 30);
  assert.equal(typography.heading.fontWeight, '700');
  assert.equal(typography.heading.lineHeight, 36); // 30 × 1.2
});

test('typography title matches UI Kit semanticTypography.title', () => {
  assert.equal(typography.title.fontSize, 20);
  assert.equal(typography.title.fontWeight, '600');
  assert.equal(typography.title.lineHeight, 30); // 20 × 1.5
});

test('typography body matches UI Kit semanticTypography.body', () => {
  assert.equal(typography.body.fontSize, 16);
  assert.equal(typography.body.fontWeight, '400');
  assert.equal(typography.body.lineHeight, 24); // 16 × 1.5
});

test('typography caption matches UI Kit semanticTypography.caption', () => {
  assert.equal(typography.caption.fontSize, 12);
  assert.equal(typography.caption.fontWeight, '400');
  assert.equal(typography.caption.lineHeight, 18); // 12 × 1.5
});

// ---------------------------------------------------------------------------
// Accessibility floor
// ---------------------------------------------------------------------------
test('a11y minTouchTarget is 44dp (WCAG 2.5.5 / ADR-010 §16)', () => {
  assert.equal(a11y.minTouchTarget, 44);
});

// ---------------------------------------------------------------------------
// Light theme colors — verbatim from UI Kit lightTheme
// ---------------------------------------------------------------------------
test('light theme colors match UI Kit lightTheme semantics', () => {
  const c = lightTheme.colors;
  assert.equal(c.background, '#FFFFFF');    // background.default
  assert.equal(c.surface, '#F8FAFC');       // background.muted
  assert.equal(c.surfaceElevated, '#FFFFFF'); // background.elevated
  assert.equal(c.border, '#E2E8F0');        // border.default
  assert.equal(c.text, '#0F172A');          // foreground.default
  assert.equal(c.textMuted, '#64748B');     // foreground.muted
  assert.equal(c.primary, '#2563EB');       // action.primary
  assert.equal(c.primaryText, '#FFFFFF');   // foreground.inverse
  assert.equal(c.danger, '#DC2626');        // status.danger
  assert.equal(c.success, '#16A34A');       // status.success
});

// ---------------------------------------------------------------------------
// Dark theme colors — verbatim from UI Kit darkTheme
// ---------------------------------------------------------------------------
test('dark theme colors match UI Kit darkTheme semantics', () => {
  const c = darkTheme.colors;
  assert.equal(c.background, '#020617');    // background.default
  assert.equal(c.surface, '#0F172A');       // background.muted
  assert.equal(c.surfaceElevated, '#1E293B'); // background.elevated
  assert.equal(c.border, '#334155');        // border.default
  assert.equal(c.text, '#F8FAFC');          // foreground.default
  assert.equal(c.textMuted, '#94A3B8');     // foreground.muted
  assert.equal(c.primary, '#3B82F6');       // action.primary
  assert.equal(c.primaryText, '#FFFFFF');   // white on blue primary — high-contrast choice
  assert.equal(c.danger, '#EF4444');        // status.danger
  assert.equal(c.success, '#22C55E');       // status.success
});

// ---------------------------------------------------------------------------
// Theme resolution
// ---------------------------------------------------------------------------
test('resolveTheme("light") returns the light theme', () => {
  const t = resolveTheme('light');
  assert.equal(t.scheme, 'light');
  assert.equal(t.colors.primary, '#2563EB');
  assert.equal(t, lightTheme);
});

test('resolveTheme("dark") returns the dark theme', () => {
  const t = resolveTheme('dark');
  assert.equal(t.scheme, 'dark');
  assert.equal(t.colors.primary, '#3B82F6');
  assert.equal(t, darkTheme);
});

test('both themes carry spacing, radius, typography and a11y', () => {
  for (const theme of [lightTheme, darkTheme]) {
    assert.equal(theme.spacing, spacing);
    assert.equal(theme.radius, radius);
    assert.equal(theme.typography, typography);
    assert.equal(theme.a11y, a11y);
  }
});

// ---------------------------------------------------------------------------
// *View aliases — structural check (RN35)
// LoadingView/EmptyView/ErrorView are React Native components (JSX) so they
// cannot be imported here (tsconfig.test.json excludes .tsx files for Node).
// Their export correctness is enforced by the full `tsc --noEmit` typecheck
// (the main tsconfig.json includes src/states/index.ts).
// ---------------------------------------------------------------------------
