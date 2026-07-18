/**
 * In-memory offline mutation queue (RN 3 — offline-ready primitives).
 *
 * Scope & deliberate non-goals (mission RN 3):
 * - FIFO, **in-memory only**. NOT persisted (no MMKV/AsyncStorage/SQLite) — the
 *   queue is lost on reload, by design. Persistence is a future ADR/mission.
 * - It does NOT replay anything automatically and has no network/timer wiring.
 *   Draining is the caller's job (when positively `online`, see network-state).
 * - It stores neutral {@link OfflineMutation} envelopes only; callers must keep
 *   secrets/PII out of payloads (ADR-015 §19).
 *
 * Framework-agnostic (no React/RN imports) → unit-testable under `node --test`.
 */
import {
  isOfflineMutation,
  OfflineMutationError,
  type OfflineMutation,
} from './mutation';

export interface OfflineMutationQueueOptions {
  /**
   * Optional hard cap on queued items. When set and reached, `enqueue` throws
   * {@link OfflineMutationError} rather than growing without bound. Omit for an
   * unbounded queue (callers SHOULD bound it in real apps).
   */
  readonly maxSize?: number;
}

/**
 * A minimal FIFO queue of {@link OfflineMutation} envelopes.
 *
 * Supported operations are intentionally small: `enqueue` / `dequeue` /
 * `peek` / `clear`, plus read-only `size` / `isEmpty` / `toArray` helpers.
 */
export class OfflineMutationQueue<TPayload = unknown> {
  private readonly items: OfflineMutation<TPayload>[] = [];
  private readonly maxSize: number | null;

  constructor(options: OfflineMutationQueueOptions = {}) {
    const max = options.maxSize;
    if (max !== undefined && (!Number.isInteger(max) || max <= 0)) {
      throw new OfflineMutationError('maxSize must be a positive integer when provided.');
    }
    this.maxSize = max ?? null;
  }

  /** Number of queued mutations. */
  get size(): number {
    return this.items.length;
  }

  /** True when the queue holds no mutations. */
  get isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Appends a mutation to the tail. Throws {@link OfflineMutationError} when the
   * mutation is structurally invalid or the queue is full.
   */
  enqueue(mutation: OfflineMutation<TPayload>): void {
    if (!isOfflineMutation(mutation)) {
      throw new OfflineMutationError('Cannot enqueue an invalid offline mutation.');
    }
    if (this.maxSize !== null && this.items.length >= this.maxSize) {
      throw new OfflineMutationError(`Offline queue is full (maxSize=${this.maxSize}).`);
    }
    this.items.push(mutation);
  }

  /** Removes and returns the head (oldest) mutation, or `undefined` when empty. */
  dequeue(): OfflineMutation<TPayload> | undefined {
    return this.items.shift();
  }

  /** Returns the head (oldest) mutation without removing it, or `undefined`. */
  peek(): OfflineMutation<TPayload> | undefined {
    return this.items[0];
  }

  /** Removes a mutation by id; returns `true` when one was removed. */
  remove(id: string): boolean {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) {
      return false;
    }
    this.items.splice(index, 1);
    return true;
  }

  /** Empties the queue. */
  clear(): void {
    this.items.length = 0;
  }

  /** A defensive snapshot (head → tail). Mutating it does not affect the queue. */
  toArray(): readonly OfflineMutation<TPayload>[] {
    return [...this.items];
  }
}
