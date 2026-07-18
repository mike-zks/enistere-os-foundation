/**
 * Local UI-state transitions (RN 6) — `node --test` over the pure model.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getFlag,
  initialUiState,
  resetUiState,
  withFlag,
  withThemePreference,
} from '../src/store/ui-state';

test('the initial state is the system theme with no flags', () => {
  assert.equal(initialUiState.themePreference, 'system');
  assert.deepEqual(initialUiState.flags, {});
});

test('withThemePreference sets the preference immutably', () => {
  const next = withThemePreference(initialUiState, 'dark');
  assert.equal(next.themePreference, 'dark');
  assert.equal(initialUiState.themePreference, 'system'); // source unchanged
  assert.notEqual(next, initialUiState);
});

test('withFlag sets a boolean flag immutably', () => {
  const a = withFlag(initialUiState, 'bannerDismissed', true);
  assert.equal(a.flags.bannerDismissed, true);
  assert.deepEqual(initialUiState.flags, {}); // source unchanged
  const b = withFlag(a, 'sidebarOpen', false);
  assert.equal(b.flags.bannerDismissed, true);
  assert.equal(b.flags.sidebarOpen, false);
});

test('getFlag defaults absent flags to false', () => {
  assert.equal(getFlag(initialUiState, 'missing'), false);
  assert.equal(getFlag(withFlag(initialUiState, 'x', true), 'x'), true);
});

test('resetUiState returns fresh defaults (logout reset)', () => {
  const reset = resetUiState();
  assert.equal(reset.themePreference, 'system');
  assert.deepEqual(reset.flags, {});
  // A fresh flags object each time (no shared mutable reference).
  assert.notEqual(reset.flags, resetUiState().flags);
});
