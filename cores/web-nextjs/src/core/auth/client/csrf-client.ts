import { BffAuthError, isRecord } from "./bff-error.js";

/**
 * Récupère un jeton CSRF frais depuis le BFF (`GET /api/auth/csrf`), pour une mutation Auth (ex. logout).
 * **Ne persiste pas** le jeton (récupération à la demande — il tourne après les flux Auth) et **ne le
 * journalise jamais**. CSRF ≠ token d'authentification.
 */
export async function getCsrfToken(signal?: AbortSignal): Promise<string> {
  let response: Response;
  try {
    response = await fetch("/api/auth/csrf", {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (cause) {
    if (signal?.aborted) throw cause;
    throw new BffAuthError("network", null, "NETWORK", "Service injoignable.", null);
  }
  if (!response.ok) {
    throw new BffAuthError("http", response.status, null, "CSRF indisponible.", response.headers.get("x-request-id"));
  }
  const body: unknown = await response.json().catch(() => null);
  if (!isRecord(body) || !isRecord(body.data) || typeof body.data.csrfToken !== "string") {
    throw new BffAuthError("invalid_response", response.status, null, "Réponse CSRF invalide.", null);
  }
  return body.data.csrfToken;
}
