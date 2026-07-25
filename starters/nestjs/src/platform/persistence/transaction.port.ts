/** Injection token for the baseline transaction adapter. */
export const TRANSACTION_PORT = Symbol('enistere.transaction-port/2.0.0');

/**
 * Neutral transaction boundary. `Context` is adapter-owned: domain code can
 * keep it unknown, while a persistence adapter may expose a typed unit of work.
 */
export interface TransactionPort<Context = unknown> {
  execute<Result>(work: (context: Context) => Promise<Result>): Promise<Result>;
}
