/**
 * Offline mutation model (RN 3 — offline-ready primitives).
 *
 * A neutral, generic envelope describing an intent to mutate server state that
 * was captured while connectivity was not available. It is a DATA TYPE only:
 * - it does NOT execute anything;
 * - it carries no business semantics (`type` is an opaque caller-defined tag);
 * - sensitive data MUST NOT be placed in `payload` (ADR-015 §19: no sensitive
 *   data offline) — the queue is in-memory and non-persistent, but callers stay
 *   responsible for what they enqueue.
 *
 * Framework-agnostic (no React/RN imports) → unit-testable under `node --test`.
 */

/** An intent to perform a mutation, captured for later (manual) replay. */
export interface OfflineMutation<TPayload = unknown> {
  /** Stable, caller-supplied identifier (e.g. a UUID). Used for dedup/removal. */
  readonly id: string;
  /** Opaque, caller-defined mutation tag. NOT interpreted by the queue. */
  readonly type: string;
  /** The mutation input. Keep it free of secrets/tokens/PII (ADR-015 §19). */
  readonly payload: TPayload;
  /** Epoch ms when the intent was captured (injected clock — never `Date.now()` here). */
  readonly createdAt: number;
}

/** Inputs accepted by {@link createOfflineMutation} (clock injected by the caller). */
export interface CreateOfflineMutationInput<TPayload> {
  readonly id: string;
  readonly type: string;
  readonly payload: TPayload;
  readonly createdAt: number;
}

/** True when a value is a structurally valid {@link OfflineMutation}. */
export function isOfflineMutation(value: unknown): value is OfflineMutation {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.type === 'string' &&
    candidate.type.length > 0 &&
    typeof candidate.createdAt === 'number' &&
    Number.isFinite(candidate.createdAt) &&
    'payload' in candidate
  );
}

/**
 * Builds a normalised {@link OfflineMutation}. The clock is the caller's
 * responsibility (pass `createdAt`) so this stays pure and deterministic.
 * Throws {@link OfflineMutationError} when the shape is invalid.
 */
export function createOfflineMutation<TPayload>(
  input: CreateOfflineMutationInput<TPayload>,
): OfflineMutation<TPayload> {
  const mutation: OfflineMutation<TPayload> = {
    id: input.id,
    type: input.type,
    payload: input.payload,
    createdAt: input.createdAt,
  };
  if (!isOfflineMutation(mutation)) {
    throw new OfflineMutationError('Invalid offline mutation: id, type and createdAt are required.');
  }
  return mutation;
}

/** Raised when an invalid mutation is built or enqueued. */
export class OfflineMutationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OfflineMutationError';
  }
}
