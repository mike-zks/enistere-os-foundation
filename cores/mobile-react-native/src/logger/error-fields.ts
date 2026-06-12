/**
 * Safe log fields from a normalised query error (RN 8).
 *
 * Bridges the server-state error model ({@link QueryError}, RN 5) to the logger
 * WITHOUT leaking anything: it keeps only the structured, non-sensitive fields
 * the UI already branches on — `kind`/`status`/`errorCode` and the correlation
 * `requestId` (ADR-040 §14) — and deliberately DROPS the human `message` and any
 * payload. Pass the result as `fields` to {@link createLogger}'s methods.
 *
 * Type-only import of `QueryError` → no runtime coupling; this module stays pure
 * and `node --test`-able.
 */
import type { QueryError } from '../query/query-errors';

/** Non-sensitive, correlation-friendly view of a failed request. */
export interface SafeErrorFields {
  readonly kind: string;
  readonly status: number | null;
  readonly errorCode: string | null;
  /** Correlation id (ADR-040 §14) — safe to log; never a secret. */
  readonly requestId: string | null;
}

/** Project a {@link QueryError} to safe log fields (no message, no payload). */
export function safeErrorFields(error: QueryError): SafeErrorFields {
  return {
    kind: error.kind,
    status: error.status,
    errorCode: error.errorCode,
    requestId: error.requestId,
  };
}
