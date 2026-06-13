/**
 * Screen-reader announcement model (RN 14 — accessibility / a11y).
 *
 * A bounded message to be SPOKEN by the screen reader (RN
 * `AccessibilityInfo.announceForAccessibility`). The message is user-facing
 * content that must reach the adapter to be spoken, so it is NOT redacted — but
 * it is NEVER logged: {@link describeAnnouncementForLog} returns metadata only
 * (length + assertiveness), never the raw text (07_SECURITY / ADR-010 §16 "pas
 * d'information sensible dans les messages").
 *
 * PURE / framework-agnostic → unit-tested under `node --test`.
 */

/** Max kept characters of an announcement. */
export const MAX_ANNOUNCEMENT_LENGTH = 300;

/** A bounded screen-reader announcement. */
export interface A11yAnnouncement {
  readonly message: string;
  /** `true` = interrupt (assertive); `false` = wait (polite, default). */
  readonly assertive: boolean;
}

/**
 * Coerce arbitrary input into a bounded {@link A11yAnnouncement} (trim, collapse
 * whitespace, cap length). A non-string / empty message yields `message: ''`.
 * Never throws.
 */
export function sanitizeAnnouncement(
  input: unknown,
): A11yAnnouncement {
  const raw =
    typeof input === 'string'
      ? { message: input }
      : input !== null && typeof input === 'object'
        ? (input as { message?: unknown; assertive?: unknown })
        : {};
  const message =
    typeof raw.message === 'string'
      ? raw.message.replace(/\s+/g, ' ').trim().slice(0, MAX_ANNOUNCEMENT_LENGTH)
      : '';
  const assertive = raw.assertive === true;
  return { message, assertive };
}

/** Safe, content-free descriptor of an announcement for logs. */
export interface SafeAnnouncementDescriptor {
  readonly length: number;
  readonly assertive: boolean;
}

/** Reduce an announcement to non-sensitive log metadata (NEVER the raw text). */
export function describeAnnouncementForLog(
  announcement: A11yAnnouncement,
): SafeAnnouncementDescriptor {
  return { length: announcement.message.length, assertive: announcement.assertive };
}
