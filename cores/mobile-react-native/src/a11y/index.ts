/**
 * Generic accessibility (a11y) primitives (RN 14).
 *
 * Pure helpers for building RN-compatible accessibility props, a normalised a11y
 * state model (ADR-010 §16 : disabled/focused/pressed/invalid + RN state), a
 * bounded screen-reader announcement model, an agnostic adapter contract, an
 * in-memory placeholder adapter, and a best-effort a11y service (safe RN 8
 * logging — never the raw label/announcement text). GENERIC only — NO native
 * `AccessibilityInfo`, NO UI, NO mandatory global provider; derived projects
 * wire a real adapter and apply the props to their components. See ARCHITECTURE
 * §23.
 */
export {
  isInteractiveRole,
  mergeA11yState,
  describeA11yStateForLog,
} from './state';
export type { A11yRole, A11yState } from './state';

export {
  MAX_LABEL_LENGTH,
  MAX_HINT_LENGTH,
  normalizeA11yText,
  buildAccessibilityState,
  buildA11yProps,
} from './props';
export type { A11yProps, A11yPropsOptions, AccessibilityStateProp } from './props';

export {
  MAX_ANNOUNCEMENT_LENGTH,
  sanitizeAnnouncement,
  describeAnnouncementForLog,
} from './announcement';
export type { A11yAnnouncement, SafeAnnouncementDescriptor } from './announcement';

export { A11yAdapterError } from './adapter';
export type { A11yAdapter, A11yFocusTarget } from './adapter';

export { createPlaceholderA11yAdapter } from './placeholder-adapter';
export type { PlaceholderA11yAdapter, PlaceholderA11yConfig } from './placeholder-adapter';

export { createA11yService } from './engine';
export type { A11yService, A11yServiceOptions } from './engine';
