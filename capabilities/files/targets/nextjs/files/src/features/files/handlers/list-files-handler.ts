import { createAuthenticatedServerApiClient } from "../../auth/api/create-authenticated-server-api-client.js";
import { resolveRequestId } from "../../auth/handlers/security.js";
import type { AuthHandlerDeps } from "../../auth/handlers/types.js";
import { jsonError, jsonOk } from "../../auth/http/web-response.js";
import { filesErrorResponse } from "../http/files-response.js";

const LIMIT_MIN = 1;
const LIMIT_MAX = 50;
const LIMIT_DEFAULT = 20;
const OFFSET_DEFAULT = 0;

/**
 * `GET /api/files` — liste paginée des fichiers possédés (lecture seule).
 *
 * Validation : `limit` ∈ [1, 50] (défaut 20), `offset` ≥ 0 (défaut 0) — 400 **sans appel API** si invalide.
 * Client serveur **`read-only`** (aucun refresh). Pas de CSRF (GET non mutatif). `no-store`. L'API reste
 * l'autorité (ownership + permission `files.read`). Aucun champ interne exposé.
 */
export async function handleListFiles(request: Request, deps: AuthHandlerDeps): Promise<Response> {
  const requestId = resolveRequestId(request);
  if (request.method !== "GET") {
    return jsonError(405, "METHOD_NOT_ALLOWED", "Méthode non autorisée.", { requestId });
  }

  const url = new URL(request.url);
  const rawLimit = url.searchParams.get("limit");
  const rawOffset = url.searchParams.get("offset");

  const limitNum = rawLimit !== null ? Number(rawLimit) : LIMIT_DEFAULT;
  const offsetNum = rawOffset !== null ? Number(rawOffset) : OFFSET_DEFAULT;

  if (!Number.isInteger(limitNum) || limitNum < LIMIT_MIN || limitNum > LIMIT_MAX) {
    return jsonError(400, "INVALID_QUERY", `Paramètre limit invalide (${LIMIT_MIN}–${LIMIT_MAX}).`, {
      requestId,
    });
  }
  if (!Number.isInteger(offsetNum) || offsetNum < 0) {
    return jsonError(400, "INVALID_QUERY", "Paramètre offset invalide (≥ 0).", { requestId });
  }

  const client = createAuthenticatedServerApiClient({
    cookieStore: deps.cookieStore,
    mode: "read-only",
    env: deps.env,
    fetch: deps.fetch,
    baseUrl: deps.baseUrl,
    requestId,
  });

  try {
    const result = await client.files.list({ limit: limitNum, offset: offsetNum });
    return jsonOk(result, { requestId });
  } catch (error) {
    return filesErrorResponse(error, requestId);
  }
}
