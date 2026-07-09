import { ApiClientError } from "@enistere/api-client-fetch";

import { createAuthenticatedServerApiClient } from "../../api/server/create-authenticated-server-api-client.js";
import { assertDelete, checkOriginAndCsrf, resolveRequestId } from "../../auth/handlers/security.js";
import type { AuthHandlerDeps } from "../../auth/handlers/types.js";
import { jsonError, jsonOk } from "../../auth/http/web-response.js";
import { filesErrorResponse } from "../http/files-response.js";
import { isUuid } from "../uuid.js";

/**
 * `DELETE /api/files/:id` — supprime un fichier. BFF **ciblé** : ordre méthode (405) → **validation UUID**
 * (400, aucun appel API) → **Origin/Referer + CSRF** (403, aucun appel API) → API. Client serveur
 * **`writable`**. Réponse **enveloppe** `{ success:true, data:null }`, `no-store`. 409 → `NOT_DELETABLE`
 * (jamais `NOT_DOWNLOADABLE`). 404 anti-énumération : absent / autre propriétaire → indistinct.
 */
export async function handleDeleteFile(
  request: Request,
  deps: AuthHandlerDeps,
  fileId: string,
): Promise<Response> {
  const requestId = resolveRequestId(request);

  const methodError = assertDelete(request, requestId);
  if (methodError) {
    return methodError;
  }
  if (!isUuid(fileId)) {
    return jsonError(400, "INVALID_ID", "Identifiant invalide.", { requestId });
  }
  const securityError = checkOriginAndCsrf(request, deps, requestId);
  if (securityError) {
    return securityError;
  }

  const client = createAuthenticatedServerApiClient({
    cookieStore: deps.cookieStore,
    mode: "writable",
    env: deps.env,
    fetch: deps.fetch,
    baseUrl: deps.baseUrl,
    requestId,
  });

  try {
    await client.files.delete(fileId);
    return jsonOk(null, { requestId });
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 409) {
      return jsonError(409, "NOT_DELETABLE", "Ce fichier ne peut pas être supprimé.", { requestId });
    }
    return filesErrorResponse(error, requestId);
  }
}
