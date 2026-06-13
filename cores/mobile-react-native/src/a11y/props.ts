/**
 * Accessibility prop builders (RN 14 — accessibility / a11y).
 *
 * Pure builders that produce **React-Native-compatible** accessibility props
 * (`accessibilityRole`/`accessibilityLabel`/`accessibilityHint`/
 * `accessibilityState`) from a generic {@link A11yState} + label/hint. A derived
 * component spreads them onto a `View`/`Pressable` — this module never renders,
 * never imports React/RN, and never logs (labels are user content).
 *
 * Labels/hints are trimmed, whitespace-collapsed and length-bounded.
 *
 * PURE / framework-agnostic → unit-tested under `node --test`.
 */
import type { A11yRole, A11yState } from './state';

/** Max kept characters of an accessibility label. */
export const MAX_LABEL_LENGTH = 200;
/** Max kept characters of an accessibility hint. */
export const MAX_HINT_LENGTH = 200;

/** Trim, collapse internal whitespace and cap a label/hint. `''`/non-string → undefined. */
export function normalizeA11yText(text: unknown, maxLength: number): string | undefined {
  if (typeof text !== 'string') {
    return undefined;
  }
  const cleaned = text.replace(/\s+/g, ' ').trim().slice(0, maxLength);
  return cleaned.length > 0 ? cleaned : undefined;
}

/** The RN `accessibilityState` subset (only the keys RN supports natively). */
export interface AccessibilityStateProp {
  readonly disabled?: boolean;
  readonly selected?: boolean;
  readonly checked?: boolean | 'mixed';
  readonly busy?: boolean;
  readonly expanded?: boolean;
}

/**
 * Project a generic {@link A11yState} to the RN-native `accessibilityState`
 * subset (drops `focused`/`pressed`/`invalid` — RN has no native field for them;
 * the consumer uses those for styling / hints). Only defined keys are included.
 */
export function buildAccessibilityState(state: A11yState | null | undefined): AccessibilityStateProp | undefined {
  const safeState = state ?? {};
  const out: Record<string, boolean | 'mixed'> = {};
  if (safeState.disabled !== undefined) out.disabled = safeState.disabled;
  if (safeState.selected !== undefined) out.selected = safeState.selected;
  if (safeState.checked !== undefined) out.checked = safeState.checked;
  if (safeState.busy !== undefined) out.busy = safeState.busy;
  if (safeState.expanded !== undefined) out.expanded = safeState.expanded;
  return Object.keys(out).length > 0 ? (out as AccessibilityStateProp) : undefined;
}

export interface A11yPropsOptions {
  readonly role?: A11yRole;
  readonly label?: string;
  readonly hint?: string;
  readonly state?: A11yState;
  /** Force the `accessible` flag (default: true when a role/label is present). */
  readonly accessible?: boolean;
}

/** RN-compatible accessibility props (spread onto a `View`/`Pressable`). */
export interface A11yProps {
  readonly accessible?: boolean;
  readonly accessibilityRole?: A11yRole;
  readonly accessibilityLabel?: string;
  readonly accessibilityHint?: string;
  readonly accessibilityState?: AccessibilityStateProp;
}

/** Build a complete, bounded {@link A11yProps} object. Never throws. */
export function buildA11yProps(options: A11yPropsOptions | null | undefined = {}): A11yProps {
  const safeOptions = options ?? {};
  const label = normalizeA11yText(safeOptions.label, MAX_LABEL_LENGTH);
  const hint = normalizeA11yText(safeOptions.hint, MAX_HINT_LENGTH);
  const accessibilityState = safeOptions.state ? buildAccessibilityState(safeOptions.state) : undefined;
  const accessible =
    safeOptions.accessible ?? (safeOptions.role !== undefined || label !== undefined ? true : undefined);

  const props: {
    accessible?: boolean;
    accessibilityRole?: A11yRole;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    accessibilityState?: AccessibilityStateProp;
  } = {};
  if (accessible !== undefined) props.accessible = accessible;
  if (safeOptions.role !== undefined) props.accessibilityRole = safeOptions.role;
  if (label !== undefined) props.accessibilityLabel = label;
  if (hint !== undefined) props.accessibilityHint = hint;
  if (accessibilityState !== undefined) props.accessibilityState = accessibilityState;
  return props;
}
