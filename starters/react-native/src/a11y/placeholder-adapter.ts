/**
 * In-memory placeholder accessibility adapter (RN 14 — accessibility / a11y).
 *
 * A dependency-free {@link A11yAdapter} for tests / wiring. It records
 * announcements and focus targets in memory — NO real `AccessibilityInfo`, NO
 * native module, NO persistence (mission). A derived project replaces it with a
 * real adapter; the contract and the service stay identical.
 *
 * Agnostic (no React/RN import) → `node --test`-able.
 */
import type { A11yAdapter, A11yFocusTarget } from './adapter';
import type { A11yAnnouncement } from './announcement';

export interface PlaceholderA11yConfig {
  /** Value returned by `isScreenReaderEnabled` (default `false`). */
  readonly screenReaderEnabled?: boolean;
}

/** A placeholder adapter exposing its in-memory buffers for assertions. */
export interface PlaceholderA11yAdapter extends A11yAdapter {
  getAnnouncements(): readonly A11yAnnouncement[];
  getFocusTargets(): readonly A11yFocusTarget[];
  clear(): void;
}

/** Create an in-memory placeholder a11y adapter (no native dependency). */
export function createPlaceholderA11yAdapter(
  config: PlaceholderA11yConfig = {},
): PlaceholderA11yAdapter {
  const announcements: A11yAnnouncement[] = [];
  const focusTargets: A11yFocusTarget[] = [];
  const enabled = config.screenReaderEnabled ?? false;

  return {
    announce(announcement: A11yAnnouncement): void {
      announcements.push(announcement);
    },
    focus(target: A11yFocusTarget): void {
      focusTargets.push(target);
    },
    async isScreenReaderEnabled(): Promise<boolean> {
      return enabled;
    },
    getAnnouncements(): readonly A11yAnnouncement[] {
      return [...announcements];
    },
    getFocusTargets(): readonly A11yFocusTarget[] {
      return [...focusTargets];
    },
    clear(): void {
      announcements.length = 0;
      focusTargets.length = 0;
    },
  };
}
