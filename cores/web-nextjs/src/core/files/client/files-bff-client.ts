import type { SchemaOf } from "@enistere/api-contracts";

import { BffAuthError, isRecord } from "../../auth/client/bff-error.js";

// Types dérivés des contrats générés (ADR-016) — aucun DTO recopié.
export type PublicStoredFile = SchemaOf<"PublicStoredFileDto">;
export type SignedDownload = SchemaOf<"SignedDownloadResponseDto">;

const DEFAULT_TIMEOUT_MS = 10_000;

function timeoutSignal(external?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(DEFAULT_TIMEOUT_MS); // timer unref
  return external ? AbortSignal.any([external, timeout]) : timeout;
}

/**
 * Client navigateur du **BFF Files** : appels **same-origin** vers `/api/files/*`, `credentials:"include"`.
 * N'appelle **jamais** l'API NestJS directement, n'injecte aucun Bearer, ne lit aucun cookie/token. Valide
 * l'enveloppe `{ success, data }` ; lève `BffAuthError` (http/network/invalid_response) **générique**.
 * **L'URL signée n'est jamais journalisée** : elle n'apparaît que dans la valeur de retour (consommée
 * immédiatement par l'appelant), jamais dans une erreur.
 */
async function bffFetch<T>(path: string, init: RequestInit, external?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { ...init, credentials: "include", signal: timeoutSignal(external) });
  } catch (cause) {
    if (external?.aborted) throw cause;
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
    throw new BffAuthError("http", response.status, errorCode, "Erreur Files.", requestId);
  }
  if (!isRecord(body) || body.success !== true || body.data === undefined) {
    throw new BffAuthError("invalid_response", response.status, null, "Réponse invalide.", requestId);
  }
  return body.data as T;
}

/** `GET /api/files/:id` → métadonnées publiques. */
export function getFileMetadata(fileId: string, signal?: AbortSignal): Promise<PublicStoredFile> {
  return bffFetch<PublicStoredFile>(
    `/api/files/${encodeURIComponent(fileId)}`,
    { method: "GET", headers: { Accept: "application/json" } },
    signal,
  );
}

/** `POST /api/files/:id/download-url` → URL signée courte `{ url, expiresAt }` (à consommer immédiatement). */
export function createFileDownloadUrl(
  fileId: string,
  csrfToken: string,
  signal?: AbortSignal,
): Promise<SignedDownload> {
  return bffFetch<SignedDownload>(
    `/api/files/${encodeURIComponent(fileId)}/download-url`,
    { method: "POST", headers: { "X-CSRF-Token": csrfToken, Accept: "application/json" } },
    signal,
  );
}
