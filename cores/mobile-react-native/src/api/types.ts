/**
 * API client types. Generic only — no domain payloads live here.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Supplies the current access token (or `null` when signed out). It is async so
 * the auth layer can resolve it from secure storage / memory without coupling
 * the client to the auth implementation.
 */
export type TokenProvider = () => Promise<string | null> | string | null;

/**
 * Invoked on a `401`. Should refresh the session and resolve to the new access
 * token, or `null` when the session can't be recovered (the client then surfaces
 * the `401` and the auth layer purges the session).
 */
export type UnauthorizedHandler = () => Promise<string | null>;

/** Per-request options shared by all verb helpers. */
export interface RequestOptions {
  /** Additional headers merged over the defaults. */
  readonly headers?: Record<string, string>;
  /** Query string parameters, appended to the URL. */
  readonly query?: Record<string, string | number | boolean | undefined>;
  /** Per-request timeout override (ms). Falls back to the client default. */
  readonly timeoutMs?: number;
  /** Skip access-token injection (e.g. public endpoints). */
  readonly skipAuth?: boolean;
  /** Caller-controlled abort signal, composed with the timeout signal. */
  readonly signal?: AbortSignal;
}

export interface ApiClientConfig {
  /** Base URL without a trailing slash. */
  readonly baseUrl: string;
  /** Default request timeout (ms). */
  readonly timeoutMs: number;
  /** Optional access-token provider for `Authorization: Bearer`. */
  readonly getAccessToken?: TokenProvider;
}
