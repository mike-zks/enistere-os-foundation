import { createAuthenticatedServerApiClient } from "../auth/api/create-authenticated-server-api-client.js";
import { errorResponse, jsonError, jsonOk } from "../auth/http/web-response.js";
import { resolveRequestId } from "../auth/handlers/security.js";
import type { AuthHandlerDeps } from "../auth/handlers/types.js";

/**
 * `GET /api/auth/authorization` — **rôles et permissions** de l'utilisateur courant (codes canoniques
 * de l'API, tels quels). Mêmes garanties que `/me` : lecture seule (**aucun refresh auto**), session via
 * cookies `HttpOnly`, pas de CSRF, `no-store`, 401 générique si session invalide, 403 relayé
 * distinctement, aucun token/structure interne exposé.
 */
export async function handleGetAuthorization(request: Request, deps: AuthHandlerDeps): Promise<Response> {
  const requestId = resolveRequestId(request);
  if (request.method !== "GET") {
    return jsonError(405, "METHOD_NOT_ALLOWED", "Méthode non autorisée.", { requestId });
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
    const authorization = await client.auth.getAuthorization();
    return jsonOk(authorization, { requestId });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
