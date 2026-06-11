/**
 * Typed API errors.
 *
 * The client maps failures to one of these so UI/error handling can branch
 * without parsing strings. Messages must stay safe to surface — never embed
 * tokens or sensitive payloads.
 */

/** Non-2xx HTTP response. */
export class ApiError extends Error {
  readonly status: number;
  readonly url: string;
  /** Parsed response body, when available (JSON or text). */
  readonly body: unknown;

  constructor(status: number, url: string, body: unknown, message?: string) {
    super(message ?? `Request to ${url} failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
    this.body = body;
  }

  /** 401/403 — authentication or authorization problem. */
  get isUnauthorized(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

/** The request never produced an HTTP response (offline, DNS, TLS…). */
export class NetworkError extends Error {
  readonly url: string;
  override readonly cause?: unknown;

  constructor(url: string, cause?: unknown) {
    super(`Network request to ${url} failed`);
    this.name = 'NetworkError';
    this.url = url;
    this.cause = cause;
  }
}

/** The request was aborted because it exceeded the configured timeout. */
export class TimeoutError extends Error {
  readonly url: string;
  readonly timeoutMs: number;

  constructor(url: string, timeoutMs: number) {
    super(`Request to ${url} timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
    this.url = url;
    this.timeoutMs = timeoutMs;
  }
}
