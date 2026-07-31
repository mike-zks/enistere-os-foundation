import { createAuthenticatedServerApiClient } from "../../auth/api/create-authenticated-server-api-client.js";
import { assertPost, checkOriginAndCsrf, resolveRequestId } from "../../auth/handlers/security.js";
import type { AuthHandlerDeps } from "../../auth/handlers/types.js";
import { jsonError, jsonOk } from "../../auth/http/web-response.js";
import { filesErrorResponse } from "../http/files-response.js";
import { isUuid } from "../uuid.js";

/**
 * `POST /api/files/:id/download-url` — crée une **URL signée courte**. Mutation **sensible** :
 * ordre méthode (405) → **validation UUID** (400, aucun appel API) → **Origin/Referer + CSRF** (403, aucun
 * appel API) → API. Client serveur **`writable`** : réutilise le mécanisme BFF existant (sur access expiré,
 * **un seul** refresh coordonné côté `api-client-fetch` puis rejeu ; sinon 401) — **aucune seconde stratégie
 * Auth**. Réponse **minimale** `{ url, expiresAt }`, `no-store`. L'URL signée n'est **jamais** journalisée
 * ni persistée ; aucun bucket/storageKey/checksum/TTL/headers AWS renvoyés. L'API reste l'autorité
 * (ownership + `files.download` + statut téléchargeable).
 */
export async function handleCreateDownloadUrl(
  request: Request,
  deps: AuthHandlerDeps,
  fileId: string,
): Promise<Response> {
  const requestId = resolveRequestId(request);

  const methodError = assertPost(request, requestId);
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
    const signed = await client.files.createDownloadUrl(fileId);
    // Réponse minimale : uniquement url + expiresAt (aucune autre propriété).
    return jsonOk({ url: signed.url, expiresAt: signed.expiresAt }, { requestId });
  } catch (error) {
    return filesErrorResponse(error, requestId);
  }
}
