/**
 * Mock `fetch` pour les tests. openapi-fetch appelle `fetch(request, init)` ; on enregistre les
 * métadonnées (Authorization, X-Request-Id, credentials, content-type) et on renvoie des réponses
 * canned. Honore l'AbortSignal (timeout). Aucune valeur de token n'est journalisée.
 */
export interface MockResponseSpec {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
}

export type MockOutcome = MockResponseSpec | 'network-error' | 'hang';

export interface RecordedCall {
  url: string;
  path: string;
  method: string;
  authorization: string | null;
  requestId: string | null;
  credentials: string;
  contentType: string | null;
  getFormData: () => Promise<FormData>;
}

export interface MockFetch {
  fetch: typeof globalThis.fetch;
  calls: RecordedCall[];
}

function buildResponse(spec: MockResponseSpec): Response {
  const headers = new Headers(spec.headers ?? {});
  if (spec.status === 204) {
    return new Response(null, { status: 204, headers });
  }
  if (spec.body !== undefined && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  return new Response(spec.body === undefined ? null : JSON.stringify(spec.body), {
    status: spec.status,
    headers,
  });
}

function abortError(): Error {
  return Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' });
}

export function createMockFetch(
  handler: (call: RecordedCall, index: number) => MockOutcome | Promise<MockOutcome>,
): MockFetch {
  const calls: RecordedCall[] = [];
  const fetchImpl = (async (input: Request | string | URL, init?: RequestInit): Promise<Response> => {
    const request = input instanceof Request ? input : new Request(input, init);
    const headers = request.headers;
    const call: RecordedCall = {
      url: request.url,
      path: new URL(request.url).pathname,
      method: request.method,
      authorization: headers.get('authorization'),
      requestId: headers.get('x-request-id'),
      credentials: request.credentials,
      contentType: headers.get('content-type'),
      getFormData: () => request.clone().formData(),
    };
    const index = calls.length;
    calls.push(call);
    const outcome = await handler(call, index);
    if (outcome === 'network-error') {
      throw new TypeError('fetch failed');
    }
    if (outcome === 'hang') {
      return await new Promise<Response>((_resolve, reject) => {
        const signal = request.signal ?? init?.signal;
        if (signal) {
          if (signal.aborted) {
            reject(abortError());
            return;
          }
          signal.addEventListener('abort', () => reject(abortError()));
        }
      });
    }
    return buildResponse(outcome);
  }) as typeof globalThis.fetch;
  return { fetch: fetchImpl, calls };
}

export function successEnvelope(data: unknown): Record<string, unknown> {
  return { success: true, data, timestamp: '2026-06-09T12:00:00.000Z' };
}

export function errorBody(statusCode: number, errorCode: string, requestId?: string): Record<string, unknown> {
  return {
    success: false,
    statusCode,
    message: 'Generic error message.',
    errorCode,
    path: '/proof',
    timestamp: '2026-06-09T12:00:00.000Z',
    ...(requestId ? { requestId } : {}),
  };
}

export const PROFILE = {
  id: 'b3f1c2d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d',
  email: 'user@example.com',
  status: 'ACTIVE',
  createdAt: '2026-06-09T12:00:00.000Z',
  updatedAt: '2026-06-09T12:00:00.000Z',
  deactivatedAt: null,
};

export function tokens(n: number): Record<string, unknown> {
  return {
    user: PROFILE,
    accessToken: `access-${n}`,
    refreshToken: `refresh-${n}`,
    accessTokenExpiresIn: 900,
    refreshTokenExpiresIn: 1209600,
    tokenType: 'Bearer',
  };
}
