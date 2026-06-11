/**
 * Generic API client built on `fetch`.
 *
 * Responsibilities (all generic — NO business endpoints):
 * - prefix paths with a configurable base URL;
 * - inject `Authorization: Bearer <token>` when a token provider yields one;
 * - enforce a timeout via `AbortController`;
 * - map failures to typed errors ({@link ApiError}/{@link NetworkError}/{@link TimeoutError}).
 *
 * Upload note: for `multipart/form-data` use `fetch + FormData` and do NOT set
 * the `Content-Type` header manually (it would break the multipart boundary).
 * Multipart upload helpers are intentionally out of scope for this foundation.
 */
import { ApiError, NetworkError, TimeoutError } from './errors';
import { ApiClientConfig, HttpMethod, RequestOptions, TokenProvider } from './types';

interface RequestInternals extends RequestOptions {
  readonly method: HttpMethod;
  readonly body?: unknown;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private getAccessToken?: TokenProvider;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.timeoutMs = config.timeoutMs;
    this.getAccessToken = config.getAccessToken;
  }

  /**
   * Wire (or replace) the access-token provider after construction. The auth
   * layer uses this to avoid a circular import between `api` and `auth`.
   */
  setTokenProvider(provider: TokenProvider | undefined): void {
    this.getAccessToken = provider;
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  private async request<T>(path: string, init: RequestInternals): Promise<T> {
    const url = this.buildUrl(path, init.query);
    const headers = await this.buildHeaders(init);
    const timeoutMs = init.timeoutMs ?? this.timeoutMs;
    const { signal, cleanup } = this.buildSignal(timeoutMs, init.signal);

    let response: Response;
    try {
      response = await fetch(url, {
        method: init.method,
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        signal,
      });
    } catch (error) {
      cleanup();
      if (isAbortError(error)) {
        throw new TimeoutError(url, timeoutMs);
      }
      throw new NetworkError(url, error);
    }
    cleanup();

    const payload = await parseBody(response);
    if (!response.ok) {
      throw new ApiError(response.status, url, payload);
    }
    return payload as T;
  }

  private buildUrl(path: string, query?: RequestOptions['query']): string {
    const base = path.startsWith('http')
      ? path
      : `${this.baseUrl}/${path.replace(/^\/+/, '')}`;
    if (!query) {
      return base;
    }
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    }
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  private async buildHeaders(init: RequestInternals): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...init.headers,
    };
    if (init.body !== undefined && headers['Content-Type'] === undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (!init.skipAuth && this.getAccessToken) {
      const token = await this.getAccessToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
    return headers;
  }

  private buildSignal(
    timeoutMs: number,
    external?: AbortSignal,
  ): { signal: AbortSignal; cleanup: () => void } {
    const controller = new AbortController();
    const onAbort = (): void => controller.abort();
    const timer = setTimeout(onAbort, timeoutMs);

    if (external) {
      if (external.aborted) {
        controller.abort();
      } else {
        external.addEventListener('abort', onAbort);
      }
    }

    return {
      signal: controller.signal,
      cleanup: () => {
        clearTimeout(timer);
        external?.removeEventListener('abort', onAbort);
      },
    };
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  const text = await response.text();
  return text.length > 0 ? text : null;
}
