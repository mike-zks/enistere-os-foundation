import { ApiClientError } from "@enistere/api-client-fetch";

/**
 * Réponses BFF normalisées. Ne relaie **jamais** la réponse brute de l'API, ni cause/stack/détails
 * Prisma/SDK. En-têtes `no-store` systématiques (routes Auth/CSRF).
 */
export interface WebOk<T> {
  readonly success: true;
  readonly data: T;
  readonly requestId?: string;
}

export interface WebErr {
  readonly success: false;
  readonly errorCode: string;
  readonly message: string;
  readonly requestId?: string;
}

export interface ResponseOptions {
  readonly requestId?: string;
  readonly extraHeaders?: Record<string, string>;
}

function buildResponse(status: number, body: WebOk<unknown> | WebErr, options?: ResponseOptions): Response {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    Pragma: "no-cache",
    ...(options?.extraHeaders ?? {}),
  });
  if (options?.requestId !== undefined) {
    headers.set("X-Request-Id", options.requestId);
  }
  return new Response(JSON.stringify(body), { status, headers });
}

export function jsonOk<T>(data: T, options?: ResponseOptions): Response {
  const body: WebOk<T> = { success: true, data, ...(options?.requestId ? { requestId: options.requestId } : {}) };
  return buildResponse(200, body, options);
}

export function jsonError(
  status: number,
  errorCode: string,
  message: string,
  options?: ResponseOptions,
): Response {
  const body: WebErr = {
    success: false,
    errorCode,
    message,
    ...(options?.requestId ? { requestId: options.requestId } : {}),
  };
  return buildResponse(status, body, options);
}

interface MappedError {
  readonly status: number;
  readonly code: string;
  readonly message: string;
}

function mapApiClientError(error: ApiClientError): MappedError {
  if (error.kind === "network") {
    return { status: 502, code: "API_UNAVAILABLE", message: "Service indisponible." };
  }
  if (error.kind === "timeout") {
    return { status: 504, code: "API_TIMEOUT", message: "Délai dépassé." };
  }
  switch (error.status) {
    case 400:
      return { status: 400, code: "BAD_REQUEST", message: "Requête invalide." };
    case 401:
      return { status: 401, code: "UNAUTHENTICATED", message: "Authentification invalide." };
    case 403:
      return { status: 403, code: "FORBIDDEN", message: "Accès refusé." };
    case 409:
      return { status: 409, code: "CONFLICT", message: "Conflit." };
    case 413:
      return { status: 413, code: "PAYLOAD_TOO_LARGE", message: "Requête trop volumineuse." };
    case 429:
      return { status: 429, code: "RATE_LIMITED", message: "Trop de tentatives." };
    default:
      if (error.status !== null && error.status >= 500) {
        return { status: 502, code: "API_ERROR", message: "Erreur du service." };
      }
      return { status: 500, code: "BFF_ERROR", message: "Erreur interne." };
  }
}

/** Convertit une erreur (ApiClientError ou autre) en réponse BFF **générique**. */
export function errorResponse(error: unknown, requestId?: string): Response {
  if (error instanceof ApiClientError) {
    const mapped = mapApiClientError(error);
    return jsonError(mapped.status, mapped.code, mapped.message, { requestId });
  }
  return jsonError(500, "BFF_ERROR", "Erreur interne.", { requestId });
}
