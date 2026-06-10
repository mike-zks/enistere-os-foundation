import { createAuthenticatedServerApiClient } from "../../api/server/create-authenticated-server-api-client.js";
import { resolveRequestId } from "../../auth/handlers/security.js";
import type { AuthHandlerDeps } from "../../auth/handlers/types.js";
import { jsonError, jsonOk } from "../../auth/http/web-response.js";
import { filesErrorResponse } from "../http/files-response.js";
import { isUuid } from "../uuid.js";

/**
 * `GET /api/files/:id` — **métadonnées publiques** d'un fichier possédé (lecture seule).
 *
 * Ordre : méthode (405) → **validation UUID** (400, **aucun appel API** si invalide) → API. Client serveur
 * **`read-only`** (`enableRefresh:false` → aucun refresh sur une lecture). Pas de CSRF (GET non mutatif).
 * `no-store`. L'API reste l'autorité (ownership + permission `files.read`) ; **404 anti-énumération** relayé
 * tel quel. Aucun champ interne (storageKey/bucket/checksum/ownerId) n'est exposé (contrat public).
 */
export async function handleGetFileMetadata(
  request: Request,
  deps: AuthHandlerDeps,
  fileId: string,
): Promise<Response> {
  const requestId = resolveRequestId(request);
  if (request.method !== "GET") {
    return jsonError(405, "METHOD_NOT_ALLOWED", "Méthode non autorisée.", { requestId });
  }
  if (!isUuid(fileId)) {
    return jsonError(400, "INVALID_ID", "Identifiant invalide.", { requestId });
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
    const file = await client.files.getMetadata(fileId);
    return jsonOk(file, { requestId });
  } catch (error) {
    return filesErrorResponse(error, requestId);
  }
}
