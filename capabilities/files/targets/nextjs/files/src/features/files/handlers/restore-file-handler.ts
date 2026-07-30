import { ApiClientError } from "@enistere/api-client-fetch";

import { createAuthenticatedServerApiClient } from "../../auth/api/create-authenticated-server-api-client.js";
import { assertPost, checkOriginAndCsrf, resolveRequestId } from "../../auth/handlers/security.js";
import type { AuthHandlerDeps } from "../../auth/handlers/types.js";
import { jsonError, jsonOk } from "../../auth/http/web-response.js";
import { filesErrorResponse } from "../http/files-response.js";
import { isUuid } from "../uuid.js";

/**
 * `POST /api/files/:id/restore` — restauration administrative (lève la quarantaine). BFF **ciblé** :
 * ordre méthode (405) → **UUID** (400, aucun appel API) → **Origin/Referer + CSRF** (403, aucun appel
 * API) → API. Client serveur **`writable`**. Pas de contrôle d'ownership (opération admin). 409 →
 * `NOT_RESTORABLE` (objet manquant ou checksum inconnu ; transition de statut invalide).
 */
export async function handleRestoreFile(
  request: Request,
  deps: AuthHandlerDeps,
  fileId: string,
): Promise<Response> {
  const requestId = resolveRequestId(request);

  const methodError = assertPost(request, requestId);
  if (methodError) return methodError;

  if (!isUuid(fileId)) {
    return jsonError(400, "INVALID_ID", "Identifiant invalide.", { requestId });
  }

  const securityError = checkOriginAndCsrf(request, deps, requestId);
  if (securityError) return securityError;

  const client = createAuthenticatedServerApiClient({
    cookieStore: deps.cookieStore,
    mode: "writable",
    env: deps.env,
    fetch: deps.fetch,
    baseUrl: deps.baseUrl,
    requestId,
  });

  try {
    await client.files.restore(fileId);
    return jsonOk(null, { requestId });
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 409) {
      return jsonError(409, "NOT_RESTORABLE", "Ce fichier ne peut pas être restauré.", { requestId });
    }
    return filesErrorResponse(error, requestId);
  }
}
