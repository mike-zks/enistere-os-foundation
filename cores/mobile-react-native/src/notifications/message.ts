/**
 * Safe local-notification message model (RN 10 — notifications).
 *
 * A bounded, content-agnostic notification payload. The foundation NEVER ships a
 * real push service: this is the shape a LOCAL notification carries, sanitised so
 * a runaway title/body/data can't blow up or leak into logs.
 *
 * SECURITY (07_SECURITY §9.4/§13, ADR-015, ADR-040) :
 * - A notification `title`/`body`/`data` is user-facing CONTENT — it may hold PII,
 *   so it is NEVER logged. {@link describeNotificationForLog} returns metadata
 *   only (lengths / key count), never the content.
 * - No push token, device token or secret belongs in a message (mission). The
 *   caller is responsible for not putting secrets in `data`; the bounds below cap
 *   size/shape but do not "understand" content.
 *
 * PURE / framework-agnostic (no React/RN/ESM import) → unit-tested under
 * `node --test`.
 */

/** Max kept characters for the title. */
export const MAX_TITLE_LENGTH = 200;
/** Max kept characters for the body. */
export const MAX_BODY_LENGTH = 2000;
/** Max number of `data` keys kept. */
export const MAX_DATA_KEYS = 32;
/** Max kept characters for a string `data` value. */
export const MAX_DATA_VALUE_LENGTH = 512;

/** Allowed `data` value primitives (no nested objects, no functions). */
export type NotificationDataValue = string | number | boolean;

/** A safe, bounded local-notification payload. */
export interface NotificationMessage {
  readonly title: string;
  readonly body: string;
  readonly data?: Readonly<Record<string, NotificationDataValue>>;
}

/** True when `value` is a structurally valid {@link NotificationMessage}. */
export function isNotificationMessage(value: unknown): value is NotificationMessage {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const msg = value as { title?: unknown; body?: unknown };
  return (
    typeof msg.title === 'string' &&
    msg.title.trim().length > 0 &&
    typeof msg.body === 'string'
  );
}

function sanitizeData(
  data: unknown,
): Readonly<Record<string, NotificationDataValue>> | undefined {
  if (typeof data !== 'object' || data === null) {
    return undefined;
  }
  const out: Record<string, NotificationDataValue> = {};
  let kept = 0;
  for (const [key, raw] of Object.entries(data as Record<string, unknown>)) {
    if (kept >= MAX_DATA_KEYS) {
      break;
    }
    if (typeof raw === 'string') {
      out[key] = raw.slice(0, MAX_DATA_VALUE_LENGTH);
      kept += 1;
    } else if (typeof raw === 'number' || typeof raw === 'boolean') {
      out[key] = raw;
      kept += 1;
    }
    // Non-primitive values (objects, arrays, functions) are dropped.
  }
  return kept > 0 ? out : undefined;
}

/**
 * Coerce arbitrary input into a bounded {@link NotificationMessage} — trims and
 * caps `title`/`body`, keeps only primitive `data` entries (bounded count/length).
 * Throws nothing; always returns a safe message (empty title/body if missing).
 */
export function sanitizeNotificationMessage(input: {
  title?: unknown;
  body?: unknown;
  data?: unknown;
}): NotificationMessage {
  const title = (typeof input.title === 'string' ? input.title : '').trim().slice(0, MAX_TITLE_LENGTH);
  const body = (typeof input.body === 'string' ? input.body : '').trim().slice(0, MAX_BODY_LENGTH);
  const data = sanitizeData(input.data);
  return data ? { title, body, data } : { title, body };
}

/** Safe, content-free descriptor of a message — for logs/telemetry only. */
export interface SafeNotificationDescriptor {
  readonly titleLength: number;
  readonly bodyLength: number;
  readonly dataKeyCount: number;
}

/** Reduce a message to non-sensitive metadata (NEVER the content). */
export function describeNotificationForLog(message: NotificationMessage): SafeNotificationDescriptor {
  return {
    titleLength: message.title.length,
    bodyLength: message.body.length,
    dataKeyCount: message.data ? Object.keys(message.data).length : 0,
  };
}
