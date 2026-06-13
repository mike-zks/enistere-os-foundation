/**
 * Framework-agnostic accessibility service (RN 14 — accessibility / a11y).
 *
 * Orchestrates an {@link A11yAdapter} for screen-reader announcements, focus and
 * the screen-reader-enabled query. It is **best-effort and non-intrusive**: an
 * accessibility helper must NEVER break the app flow, so a failing adapter is
 * caught and a safe `warn` is logged (no sensitive cause); `isScreenReaderEnabled`
 * defaults to `false` on error.
 *
 * Logging (ADR-040 / RN 8) : optional injected logger; logs ONLY safe metadata
 * (`{ length, assertive }` for announcements, `{ operation }` on failure) —
 * NEVER the raw announcement/label text, and never bypasses the redaction.
 *
 * PURE / framework-agnostic (no React/RN import) → `node --test`-able.
 */
import type { Logger } from '../logger/logger';
import { A11yAdapterError, type A11yAdapter, type A11yFocusTarget } from './adapter';
import {
  describeAnnouncementForLog,
  sanitizeAnnouncement,
  type A11yAnnouncement,
} from './announcement';

export interface A11yService {
  /** Announce a message via the screen reader (sanitised; never throws). */
  announce(input: string | { message?: unknown; assertive?: unknown }): void;
  /** Move accessibility focus to a logical target (best-effort; never throws). */
  focus(target: A11yFocusTarget): void;
  /** Whether a screen reader is active (defaults to `false` on error). */
  isScreenReaderEnabled(): Promise<boolean>;
}

export interface A11yServiceOptions {
  readonly adapter: A11yAdapter;
  /** Optional RN 8 logger (safe metadata only). */
  readonly logger?: Logger;
}

/** Build an {@link A11yService} over an adapter (+ optional safe logger). */
export function createA11yService(options: A11yServiceOptions): A11yService {
  const { adapter, logger } = options;

  function announce(input: string | { message?: unknown; assertive?: unknown }): void {
    const announcement: A11yAnnouncement = sanitizeAnnouncement(input);
    if (announcement.message.length === 0) {
      return; // nothing to announce
    }
    try {
      adapter.announce(announcement);
      logger?.debug('a11y announcement', { ...describeAnnouncementForLog(announcement) });
    } catch {
      // Best-effort: an announcement failure must never break the app flow.
      logger?.warn('a11y announce failed', { operation: new A11yAdapterError('announce').operation });
    }
  }

  function focus(target: A11yFocusTarget): void {
    if (!adapter.focus) {
      return;
    }
    try {
      adapter.focus(target);
    } catch {
      logger?.warn('a11y focus failed', { operation: new A11yAdapterError('focus').operation });
    }
  }

  async function isScreenReaderEnabled(): Promise<boolean> {
    if (!adapter.isScreenReaderEnabled) {
      return false;
    }
    try {
      return await adapter.isScreenReaderEnabled();
    } catch {
      logger?.warn('a11y isScreenReaderEnabled failed', {
        operation: new A11yAdapterError('isScreenReaderEnabled').operation,
      });
      return false; // safe default: assume no screen reader
    }
  }

  return { announce, focus, isScreenReaderEnabled };
}
