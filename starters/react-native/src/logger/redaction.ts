/**
 * Central redaction (RN 8 — logger / observability).
 *
 * The ONLY place that decides what is sensitive (ADR-040 §17 : "liste
 * centralisée, jamais dispersée par module"). Every value that reaches the
 * logger passes through {@link redactValue} (objects) or {@link redactString}
 * (free text), so a token, Authorization header, cookie, signed URL, device
 * `uri` or obvious PII can never reach a sink — even a custom one.
 *
 * SECURITY (07_SECURITY §13.1 / §9.4, ADR-015 §21, ADR-040 §17/§18) — NEVER in a
 * log: password, OTP, access/refresh token, JWT, `Authorization`, cookies, API
 * keys, secrets, signed URLs, device file paths, request/response bodies, email
 * or other obvious personal data.
 *
 * This module is PURE and framework-agnostic (no React/RN/ESM import) → it is
 * unit-tested under `node --test`. A masked value is replaced by {@link REDACTED}
 * (never silently dropped when the field exists, ADR-040 §17).
 */

/** Marker substituted for any redacted value. */
export const REDACTED = '[Redacted]';

/** Placeholder when recursion is too deep / a cycle is detected. */
const TRUNCATED = '[Truncated]';
const CIRCULAR = '[Circular]';

/** Defensive recursion bound (logs are diagnostics, not deep dumps). */
const MAX_DEPTH = 8;

/**
 * Object/field keys whose VALUE is always masked, compared after normalisation
 * (lowercased, non-alphanumerics stripped) so `access_token`, `Access-Token` and
 * `accessToken` all match — but `author`/`monkey` do NOT (exact normalised set).
 */
const SENSITIVE_KEYS: ReadonlySet<string> = new Set([
  'authorization',
  'proxyauthorization',
  'cookie',
  'setcookie',
  'password',
  'passwordhash',
  'pwd',
  'pass',
  'otp',
  'pin',
  'token',
  'accesstoken',
  'refreshtoken',
  'idtoken',
  'sessiontoken',
  'tokenhash',
  'jwt',
  'bearer',
  'secret',
  'clientsecret',
  'apikey',
  'apisecret',
  'accesskey',
  'secretkey',
  'privatekey',
  'signedurl',
  'presignedurl',
  'signature',
  'credential',
  'credentials',
  'email',
  'emailaddress',
  'phone',
  'phonenumber',
  'creditcard',
  'cardnumber',
  'cvv',
  'cvc',
]);

/** Normalise a key for sensitivity matching (lowercase, alphanumerics only). */
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** True when a key's value must always be masked. */
export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(normalizeKey(key));
}

/**
 * Redact sensitive substrings inside a free-text string. Catches device URIs,
 * `Bearer`/`Basic` credentials, JWTs, signed-URL query params and emails while
 * leaving ordinary text intact. Order matters (credentials/URIs before the
 * generic email/param sweeps).
 */
export function redactString(input: string): string {
  let out = input;

  // Device file paths (07_SECURITY §9.4 / ADR-015) — keep the scheme, drop the
  // path which can identify the user / leak local storage layout.
  out = out.replace(
    /\b(file|content|ph|assets-library):\/\/\S*/gi,
    (_match, scheme: string) => `${scheme}://${REDACTED}`,
  );

  // `Authorization: Bearer <token>` / `Basic <base64>`.
  out = out.replace(/\bBearer\s+[\w.\-+/=]+/gi, `Bearer ${REDACTED}`);
  out = out.replace(/\bBasic\s+[\w.\-+/=]+/gi, `Basic ${REDACTED}`);

  // Bare JWTs (three base64url segments) anywhere in the text.
  out = out.replace(/\b[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{6,}\b/g, REDACTED);

  // Sensitive query-string params (signed URLs: X-Amz-Signature/Credential,
  // token, access_token, sig, key, code, secret, password, auth…).
  out = out.replace(
    /([?&][^=&\s]*(?:token|signature|sig|secret|password|credential|key|code|auth)[^=&\s]*=)[^&#\s]*/gi,
    (_match, prefix: string) => `${prefix}${REDACTED}`,
  );

  // Obvious emails (PII).
  out = out.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, REDACTED);

  return out;
}

/**
 * Deep-redact an arbitrary value for safe logging. Masks sensitive KEYS, scrubs
 * sensitive substrings in strings, serialises `Error` safely (name + redacted
 * message, no stack — a stack can carry device paths), and guards against deep
 * nesting and cycles. Returns a NEW value; the input is never mutated.
 */
export function redactValue(value: unknown): unknown {
  return redactInternal(value, 0, new WeakSet<object>());
}

function redactInternal(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  switch (typeof value) {
    case 'string':
      return redactString(value);
    case 'number':
    case 'boolean':
      return value;
    case 'bigint':
      return `${value}`;
    case 'function':
      return '[Function]';
    case 'symbol':
      return '[Symbol]';
    default:
      break;
  }

  if (depth >= MAX_DEPTH) {
    return TRUNCATED;
  }

  const obj = value as object;
  if (seen.has(obj)) {
    return CIRCULAR;
  }
  seen.add(obj);

  if (value instanceof Error) {
    // Name + redacted message only — never the stack (may contain device paths).
    return { name: value.name, message: redactString(value.message) };
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactInternal(item, depth + 1, seen));
  }

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>)) {
    result[key] = isSensitiveKey(key)
      ? REDACTED
      : redactInternal((value as Record<string, unknown>)[key], depth + 1, seen);
  }
  return result;
}
