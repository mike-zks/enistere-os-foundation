import { createAuthenticatedServerApiClient } from "../api/create-authenticated-server-api-client.js";
import { errorResponse, jsonError, jsonOk } from "../http/web-response.js";
import { resolveRequestId } from "./security.js";
import type { AuthHandlerDeps } from "./types.js";

/**
 * `GET /api/auth/me` — profil **public** de l'utilisateur courant.
 *
 * Lecture seule : client **`read-only`** (`enableRefresh:false`) → **aucun refresh automatique** (un
 * `GET /me` ne déclenche jamais de rotation de cookies). Session lue via les cookies `HttpOnly`. Pas de
 * CSRF (méthode non mutative). `no-store`. Session absente/invalide → **401 générique** ; un 403 réel de
 * l'API est relayé **distinctement**. Aucun token/cookie/réponse brute exposé.
 */
export async function handleGetProfile(request: Request, deps: AuthHandlerDeps): Promise<Response> {
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
    const profile = await client.auth.getProfile();
    return jsonOk(profile, { requestId });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
