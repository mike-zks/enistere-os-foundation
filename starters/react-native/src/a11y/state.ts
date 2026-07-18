/**
 * Normalised accessibility state model (RN 14 — accessibility / a11y).
 *
 * A generic, RN-flavoured a11y state. It preserves the UI states required by
 * ADR-010 §16 (**disabled, focused, pressed, invalid**) plus the React Native
 * `accessibilityState` fields (selected/checked/busy/expanded), so a derived
 * component can both style on the full state AND emit RN-compatible props
 * (see {@link buildAccessibilityState} in `props.ts`).
 *
 * SECURITY (07_SECURITY / ADR-010 §16) : the state holds only booleans/enums —
 * NO user content, so it is safe to describe in logs. PURE / framework-agnostic
 * (no React/RN/ESM import) → unit-tested under `node --test`.
 */

/** Curated subset of React Native `AccessibilityRole` values. */
export type A11yRole =
  | 'none'
  | 'text'
  | 'header'
  | 'image'
  | 'summary'
  | 'alert'
  | 'button'
  | 'link'
  | 'search'
  | 'imagebutton'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'adjustable'
  | 'combobox'
  | 'spinbutton'
  | 'tab'
  | 'menuitem';

/** Interactive roles (a user can act on them). */
const INTERACTIVE_ROLES: ReadonlySet<A11yRole> = new Set([
  'button',
  'link',
  'search',
  'imagebutton',
  'checkbox',
  'radio',
  'switch',
  'adjustable',
  'combobox',
  'spinbutton',
  'tab',
  'menuitem',
]);

/** True when `role` denotes an interactive element. */
export function isInteractiveRole(role: A11yRole): boolean {
  return INTERACTIVE_ROLES.has(role);
}

/**
 * Normalised a11y state. ADR-010 §16 quartet (`disabled`/`focused`/`pressed`/
 * `invalid`) + the RN `accessibilityState` subset. All optional booleans, except
 * `checked` which may be tri-state (`'mixed'`).
 */
export interface A11yState {
  readonly disabled?: boolean;
  readonly focused?: boolean;
  readonly pressed?: boolean;
  readonly invalid?: boolean;
  readonly selected?: boolean;
  readonly checked?: boolean | 'mixed';
  readonly busy?: boolean;
  readonly expanded?: boolean;
}

const STATE_KEYS: readonly (keyof A11yState)[] = [
  'disabled',
  'focused',
  'pressed',
  'invalid',
  'selected',
  'checked',
  'busy',
  'expanded',
];

/**
 * Merge two a11y states; defined keys in `override` win over `base`. Returns a
 * new object (inputs untouched). `undefined` override values are ignored.
 */
export function mergeA11yState(
  base: A11yState | null | undefined,
  override: A11yState | null | undefined,
): A11yState {
  const safeBase = base ?? {};
  const safeOverride = override ?? {};
  const result: Record<string, boolean | 'mixed'> = {};
  for (const key of STATE_KEYS) {
    const overrideValue = safeOverride[key];
    const baseValue = safeBase[key];
    const value = overrideValue !== undefined ? overrideValue : baseValue;
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as A11yState;
}

/**
 * Safe descriptor of an a11y state for logs — the booleans/enum only (NO user
 * content can ever be present here).
 */
export function describeA11yStateForLog(state: A11yState | null | undefined): A11yState {
  return mergeA11yState({}, state);
}
