import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

type InjectedFetch = (request: Request) => Promise<Response>;

export interface MockResponseSpec {
  /** Code HTTP (défaut 200). */
  readonly status?: number;
  /** Corps JSON renvoyé. */
  readonly body?: unknown;
  /** `X-Request-Id` renvoyé par l'API. */
  readonly requestId?: string;
  /** Rejette le `fetch` (erreur réseau simulée). */
  readonly throwError?: unknown;
  /** Ne se résout jamais : rejette `AbortError` à l'abandon (test de timeout). */
  readonly hangUntilAbort?: boolean;
}

export interface RecordedRequest {
  readonly url: string;
  readonly method: string;
  readonly headers: Record<string, string>;
}

export interface MockFetch extends InjectedFetch {
  readonly calls: RecordedRequest[];
}

/** Construit un `fetch` mock (signature `openapi-fetch` : reçoit un `Request`). Enregistre les appels. */
export function createMockFetch(spec: MockResponseSpec | ((req: Request) => MockResponseSpec)): MockFetch {
  const calls: RecordedRequest[] = [];
  const fn = async (request: Request): Promise<Response> => {
    calls.push({
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
    });
    const s = typeof spec === "function" ? spec(request) : spec;
    if (s.hangUntilAbort === true) {
      return new Promise<Response>((_resolve, reject) => {
        request.signal.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        );
      });
    }
    if (s.throwError !== undefined) {
      throw s.throwError;
    }
    const headers = new Headers({ "content-type": "application/json" });
    if (s.requestId !== undefined) {
      headers.set("x-request-id", s.requestId);
    }
    const status = s.status ?? 200;
    const bodyText = s.body !== undefined ? JSON.stringify(s.body) : "";
    return new Response(bodyText, { status, headers });
  };
  return Object.assign(fn, { calls });
}

/** Enveloppe canonique de succès de l'API. */
export function envelope<T>(data: T): { success: true; data: T; timestamp: string } {
  return { success: true, data, timestamp: "2026-06-09T12:00:00.000Z" };
}

/**
 * `QueryClient` de test (pas de retry, pas de GC). `gcTime: Infinity` **aussi pour les mutations** :
 * sans cela, une mutation réglée (ex. `useLogin`) programme un timer GC **ref** de 5 min par défaut qui
 * maintient le process `node --test` en vie après la fin des tests (~300 s). Avec `Infinity`, aucun timer
 * n'est programmé (cf. `isValidTimeout`), et `client.clear()` en `afterEach` suffit au nettoyage.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false, gcTime: Number.POSITIVE_INFINITY },
    },
  });
}

/** Wrapper React fournissant un `QueryClient` donné. */
export function createWrapper(client: QueryClient): (props: { children: ReactNode }) => ReactNode {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

/** Installe un `globalThis.fetch` qui échoue : toute requête réelle non mockée fait échouer le test. */
export function forbidRealFetch(): void {
  globalThis.fetch = (() => {
    throw new Error("Requête réseau réelle interdite en test (fetch non mocké).");
  }) as typeof fetch;
}

/** Affecte un `fetch` mock comme `globalThis.fetch` (chemin singleton/hook). */
export function useGlobalFetch(mock: InjectedFetch): void {
  globalThis.fetch = mock as unknown as typeof fetch;
}
