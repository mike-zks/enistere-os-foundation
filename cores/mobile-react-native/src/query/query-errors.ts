/**
 * Minimal, SAFE normalisation of the official client's `ApiClientError` for the
 * UI (RN 5 — server-state data layer).
 *
 * Turns any thrown value (`ApiClientError`, plain `Error`, unknown) into a flat
 * {@link QueryError} the UI can branch on. Governance:
 * - **No sensitive data** (ADR-015/016): the `message` is a GENERIC, hard-coded
 *   string derived from kind/status — it NEVER echoes the raw error message,
 *   `details`, a token, an Authorization header or a signed URL. UI logic should
 *   branch on `status`/`errorCode`/`kind` (ADR-016 §28), not on the message.
 * - **No `@enistere/*` import**: `ApiClientError` is read STRUCTURALLY (its public
 *   `kind`/`status`/`errorCode`/`requestId` fields), so this module is pure and
 *   framework-agnostic → unit-testable under `node --test`.
 */

/** Normalised error kind (mirrors `ApiClientError.kind`, plus `unknown`). */
export type QueryErrorKind =
  | 'http'
  | 'network'
  | 'timeout'
  | 'invalid_response'
  | 'session_expired'
  | 'unknown';

/** Flat, UI-friendly, sensitive-data-free view of a failed request. */
export interface QueryError {
  readonly kind: QueryErrorKind;
  readonly status: number | null;
  readonly errorCode: string | null;
  /** Correlation id (ADR-040) — NOT a secret; safe to show/log. */
  readonly requestId: string | null;
  readonly isUnauthorized: boolean;
  readonly isForbidden: boolean;
  readonly isNotFound: boolean;
  /** A generic, safe message. Never contains sensitive detail. */
  readonly message: string;
}

const KINDS: readonly QueryErrorKind[] = [
  'http',
  'network',
  'timeout',
  'invalid_response',
  'session_expired',
];

function readKind(value: Record<string, unknown>): QueryErrorKind {
  const kind = value.kind;
  return typeof kind === 'string' && (KINDS as readonly string[]).includes(kind)
    ? (kind as QueryErrorKind)
    : 'unknown';
}

function readStatus(value: Record<string, unknown>): number | null {
  return typeof value.status === 'number' ? value.status : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** A generic, safe message by kind/status. Never derived from raw error text. */
function safeMessage(kind: QueryErrorKind, status: number | null): string {
  if (kind === 'session_expired') {
    return 'Your session has expired. Please sign in again.';
  }
  if (kind === 'network') {
    return 'Network error. Please check your connection and try again.';
  }
  if (kind === 'timeout') {
    return 'The request timed out. Please try again.';
  }
  switch (status) {
    case 401:
      return 'You need to sign in to continue.';
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return 'Not found.';
    case 409:
      return 'This action conflicts with the current state.';
    case 429:
      return 'Too many requests. Please try again later.';
    default:
      if (status !== null && status >= 500) {
        return 'The service is temporarily unavailable. Please try again later.';
      }
      return 'Something went wrong. Please try again.';
  }
}

/** Normalises any thrown value into a safe {@link QueryError}. */
export function toQueryError(error: unknown): QueryError {
  if (typeof error !== 'object' || error === null) {
    return {
      kind: 'unknown',
      status: null,
      errorCode: null,
      requestId: null,
      isUnauthorized: false,
      isForbidden: false,
      isNotFound: false,
      message: safeMessage('unknown', null),
    };
  }

  const value = error as Record<string, unknown>;
  const kind = readKind(value);
  const status = readStatus(value);
  const isUnauthorized = status === 401 || kind === 'session_expired';

  return {
    kind,
    status,
    errorCode: readString(value.errorCode),
    requestId: readString(value.requestId),
    isUnauthorized,
    isForbidden: status === 403,
    isNotFound: status === 404,
    message: safeMessage(kind, status),
  };
}
