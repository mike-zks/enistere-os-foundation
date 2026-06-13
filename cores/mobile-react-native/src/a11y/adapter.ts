/**
 * Accessibility adapter contract (RN 14 — accessibility / a11y).
 *
 * The seam between the agnostic {@link A11yService} and the platform a11y APIs
 * (RN `AccessibilityInfo` : `announceForAccessibility`, `setAccessibilityFocus`,
 * `isScreenReaderEnabled`). The foundation ships only the contract + an in-memory
 * placeholder — NO real `AccessibilityInfo`, NO native module (mission). A
 * derived project wires a real adapter.
 *
 * Agnostic (no React/RN import) → `node --test`-able.
 */
import type { A11yAnnouncement } from './announcement';

/** A logical focus target the adapter maps to a native node handle. */
export interface A11yFocusTarget {
  readonly id: string;
}

export interface A11yAdapter {
  /** Announce a (sanitised) message via the screen reader. */
  announce(announcement: A11yAnnouncement): void;
  /** Optionally move accessibility focus to a logical target. */
  focus?(target: A11yFocusTarget): void;
  /** Optionally report whether a screen reader is active. */
  isScreenReaderEnabled?(): Promise<boolean>;
}

/**
 * Controlled error for a failed adapter operation. Carries only the safe
 * `operation` (no underlying message/cause → no sensitive leak).
 */
export class A11yAdapterError extends Error {
  readonly operation: 'announce' | 'focus' | 'isScreenReaderEnabled';

  constructor(operation: 'announce' | 'focus' | 'isScreenReaderEnabled') {
    super(`Accessibility adapter "${operation}" failed.`);
    this.name = 'A11yAdapterError';
    this.operation = operation;
  }
}
