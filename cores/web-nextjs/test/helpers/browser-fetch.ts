/**
 * Mock de `globalThis.fetch` pour les appels **navigateur** `fetch(url, init)` (client BFF Auth).
 * Distinct de `createMockFetch` (qui reçoit un `Request` openapi-fetch). Enregistre url/méthode/en-têtes/
 * credentials et permet le routage par URL.
 */
export interface BrowserResponseSpec {
  readonly status?: number;
  readonly body?: unknown;
  readonly rawBody?: string;
  readonly requestId?: string;
  readonly throwError?: unknown;
  readonly hangUntilAbort?: boolean;
}

export interface BrowserCall {
  readonly url: string;
  readonly method: string;
  readonly headers: Record<string, string>;
  readonly credentials: string | undefined;
}

interface MinimalInit {
  method?: string;
  headers?: HeadersInit;
  credentials?: string;
  signal?: AbortSignal;
}

export interface BrowserFetchMock {
  (input: string | URL | Request, init?: MinimalInit): Promise<Response>;
  readonly calls: BrowserCall[];
}

export function createBrowserFetch(
  spec: BrowserResponseSpec | ((url: string) => BrowserResponseSpec),
): BrowserFetchMock {
  const calls: BrowserCall[] = [];
  const fn = async (input: string | URL | Request, init?: MinimalInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = (init?.method ?? "GET").toUpperCase();
    const headers = new Headers(init?.headers ?? {});
    calls.push({
      url,
      method,
      headers: Object.fromEntries(headers.entries()),
      credentials: init?.credentials,
    });

    const s = typeof spec === "function" ? spec(url) : spec;
    const signal = init?.signal;

    if (s.hangUntilAbort === true) {
      return new Promise<Response>((_resolve, reject) => {
        const abort = (): void => reject(new DOMException("Aborted", "AbortError"));
        if (signal?.aborted) abort();
        else signal?.addEventListener("abort", abort, { once: true });
      });
    }
    if (s.throwError !== undefined) {
      throw s.throwError;
    }
    const responseHeaders = new Headers({ "content-type": "application/json" });
    if (s.requestId !== undefined) {
      responseHeaders.set("x-request-id", s.requestId);
    }
    const payload = s.rawBody !== undefined ? s.rawBody : s.body !== undefined ? JSON.stringify(s.body) : "";
    return new Response(payload, { status: s.status ?? 200, headers: responseHeaders });
  };
  return Object.assign(fn, { calls });
}
