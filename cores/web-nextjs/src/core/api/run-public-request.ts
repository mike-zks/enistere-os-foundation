import { ApiClientError } from "@enistere/api-client-fetch";

/**
 * Forme minimale d'un résultat `openapi-fetch` (sans importer ses types internes). On ne dépend que
 * de `data` (enveloppe), `error` et `response`.
 */
export interface OpenapiFetchResult<TEnvelope> {
  readonly data?: TEnvelope;
  readonly error?: unknown;
  readonly response: Response;
}

export interface RunRequestOptions {
  /** Signal externe (annulation TanStack Query au démontage / refetch). */
  readonly signal?: AbortSignal;
  /** Délai maximal en ms (défaut : 10000). */
  readonly timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;

/** Identifiant de corrélation renvoyé par l'API (`X-Request-Id`). */
export function readRequestId(response: Response): string | null {
  return response.headers.get("x-request-id");
}

/**
 * Exécute un appel `openapi-fetch` « brut » (`client.raw`) pour un endpoint **public**.
 *
 * - applique un **timeout** (AbortController) en plus de l'annulation externe éventuelle ;
 * - **normalise** tout échec en `ApiClientError` (jamais de corps brut, jamais de cause exposée) ;
 * - retourne le contenu de l'enveloppe (`{ success, data, timestamp }` → `data`), **sans recopier**
 *   les DTO (le type vient des contrats générés via l'appelant).
 *
 * Une annulation **externe** (signal fourni par TanStack Query) est relayée telle quelle pour être
 * traitée comme une annulation (et non comme une erreur applicative).
 */
export async function runPublicRequest<TData>(
  call: (signal: AbortSignal) => Promise<OpenapiFetchResult<{ data: TData }>>,
  options?: RunRequestOptions,
): Promise<TData> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const external = options?.signal;
  const onExternalAbort = (): void => controller.abort();

  if (external) {
    if (external.aborted) {
      controller.abort();
    } else {
      external.addEventListener("abort", onExternalAbort, { once: true });
    }
  }
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let result: OpenapiFetchResult<{ data: TData }>;
  try {
    result = await call(controller.signal);
  } catch (cause) {
    if (external?.aborted) {
      throw cause; // annulation externe → laissée à TanStack Query
    }
    if (controller.signal.aborted) {
      throw ApiClientError.timeout(null);
    }
    throw ApiClientError.network("Échec réseau.", null, cause);
  } finally {
    clearTimeout(timer);
    if (external) {
      external.removeEventListener("abort", onExternalAbort);
    }
  }

  const requestId = readRequestId(result.response);

  if (!result.response.ok || result.error !== undefined) {
    throw ApiClientError.fromHttp(result.response.status, result.error ?? result.data, requestId);
  }

  const envelope = result.data;
  if (envelope === undefined || envelope.data === undefined) {
    throw new ApiClientError({
      kind: "invalid_response",
      message: "Réponse invalide.",
      status: result.response.status,
      requestId,
    });
  }
  return envelope.data;
}
