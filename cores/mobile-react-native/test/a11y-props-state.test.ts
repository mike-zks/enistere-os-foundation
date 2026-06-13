/**
 * a11y props + state model (RN 14 — accessibility) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  MAX_LABEL_LENGTH,
  buildA11yProps,
  buildAccessibilityState,
  normalizeA11yText,
} from '../src/a11y/props';
import {
  describeA11yStateForLog,
  isInteractiveRole,
  mergeA11yState,
} from '../src/a11y/state';

test('normalizeA11yText trims, collapses whitespace and bounds', () => {
  assert.equal(normalizeA11yText('  hello   world  ', 50), 'hello world');
  assert.equal(normalizeA11yText('   ', 50), undefined);
  assert.equal(normalizeA11yText(42, 50), undefined);
  assert.equal(normalizeA11yText('x'.repeat(MAX_LABEL_LENGTH + 20), MAX_LABEL_LENGTH)?.length, MAX_LABEL_LENGTH);
});

test('isInteractiveRole distinguishes interactive vs static roles', () => {
  for (const role of ['button', 'link', 'checkbox', 'switch', 'tab', 'adjustable'] as const) {
    assert.equal(isInteractiveRole(role), true, role);
  }
  for (const role of ['text', 'header', 'image', 'none', 'alert'] as const) {
    assert.equal(isInteractiveRole(role), false, role);
  }
});

test('mergeA11yState lets defined override keys win, ignores undefined', () => {
  const merged = mergeA11yState(
    { disabled: false, focused: true, checked: 'mixed' },
    { disabled: true, focused: undefined, selected: true },
  );
  assert.deepEqual(merged, { disabled: true, focused: true, checked: 'mixed', selected: true });
});

test('buildAccessibilityState keeps only RN-native keys, drops focused/pressed/invalid', () => {
  const state = buildAccessibilityState({
    disabled: true,
    selected: false,
    checked: 'mixed',
    busy: true,
    expanded: false,
    focused: true, // dropped (no native RN field)
    pressed: true, // dropped
    invalid: true, // dropped
  });
  assert.deepEqual(state, { disabled: true, selected: false, checked: 'mixed', busy: true, expanded: false });
});

test('buildAccessibilityState returns undefined when no native key is set', () => {
  assert.equal(buildAccessibilityState({ focused: true, pressed: true, invalid: true }), undefined);
});

test('buildA11yProps composes RN-compatible props', () => {
  const props = buildA11yProps({
    role: 'button',
    label: '  Save  changes ',
    hint: 'Submits the form',
    state: { disabled: true, pressed: true },
  });
  assert.deepEqual(props, {
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: 'Save changes',
    accessibilityHint: 'Submits the form',
    accessibilityState: { disabled: true }, // pressed dropped (no native field)
  });
});

test('buildA11yProps omits empty fields and leaves accessible undefined when nothing set', () => {
  assert.deepEqual(buildA11yProps({}), {});
  assert.deepEqual(buildA11yProps({ label: '   ' }), {});
  assert.deepEqual(buildA11yProps({ accessible: false, role: 'text' }), {
    accessible: false,
    accessibilityRole: 'text',
  });
});

test('describeA11yStateForLog returns only booleans/enums (no user content possible)', () => {
  assert.deepEqual(describeA11yStateForLog({ disabled: true, invalid: true }), {
    disabled: true,
    invalid: true,
  });
});
