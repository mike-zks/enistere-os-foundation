import type { SchemaOf } from "@enistere/api-contracts";

import { BffAuthError, isRecord } from "./bff-error.js";

// Types dérivés des contrats générés (ADR-016) — aucun DTO recopié.
export type UserProfile = SchemaOf<"UserProfileResponseDto">;
export type AuthorizationSummary = SchemaOf<"AuthorizationSummaryResponseDto">;

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Client navigateur du **BFF Auth** : appels **same-origin** vers `/api/auth/*`, `credentials: include`
 * (cookies `HttpOnly` envoyés par le navigateur — jamais lus par le JS). N'appelle **jamais** l'API
 * NestJS directement, n'utilise **pas** `NEXT_PUBLIC_API_URL`, ne lit aucun token/cookie. Valide
 * l'enveloppe (`{ success, data }`) ; lève `BffAuthError` (HTTP / réseau / réponse invalide).
 */
async function bffGet<T>(path: string, externalSignal?: AbortSignal): Promise<T> {
  // `AbortSignal.timeout` utilise un timer **unref** (ne maintient pas l'event loop en vie),
  // combiné à l'annulation externe éventuelle (TanStack Query) via `AbortSignal.any`.
  const timeoutSignal = AbortSignal.timeout(DEFAULT_TIMEOUT_MS);
  const signal = externalSignal ? AbortSignal.any([externalSignal, timeoutSignal]) : timeoutSignal;

  let response: Response;
  try {
    response = await fetch(path, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (cause) {
    if (externalSignal?.aborted) throw cause;
    throw new BffAuthError("network", null, "NETWORK", "Service injoignable.", null);
  }

  const requestId = response.headers.get("x-request-id");
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new BffAuthError("invalid_response", response.status, null, "Réponse invalide.", requestId);
  }

  if (!response.ok) {
    const errorCode = isRecord(body) && typeof body.errorCode === "string" ? body.errorCode : null;
    throw new BffAuthError("http", response.status, errorCode, "Erreur d'authentification.", requestId);
  }
  if (!isRecord(body) || body.success !== true || body.data === undefined) {
    throw new BffAuthError("invalid_response", response.status, null, "Réponse invalide.", requestId);
  }
  return body.data as T;
}

/** `GET /api/auth/me` → profil public. */
export function fetchSessionProfile(signal?: AbortSignal): Promise<UserProfile> {
  return bffGet<UserProfile>("/api/auth/me", signal);
}

/** `GET /api/auth/authorization` → rôles/permissions. */
export function fetchAuthorization(signal?: AbortSignal): Promise<AuthorizationSummary> {
  return bffGet<AuthorizationSummary>("/api/auth/authorization", signal);
}
