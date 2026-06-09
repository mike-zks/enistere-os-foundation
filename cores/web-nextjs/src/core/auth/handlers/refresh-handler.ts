import { ApiClientError } from "@enistere/api-client-fetch";

import { createAuthenticatedServerApiClient } from "../../api/server/create-authenticated-server-api-client.js";
import { errorResponse, jsonError, jsonOk } from "../http/web-response.js";
import { WebAuthSessionAdapter } from "../web-session-adapter.js";
import { assertPost, checkOriginAndCsrf, resolveRequestId, rotateCsrfCookie } from "./security.js";
import type { AuthHandlerDeps } from "./types.js";

/**
 * `POST /api/auth/refresh` (corps vide). Le refresh token est lu **uniquement** depuis le cookie
 * `HttpOnly`. Un seul appel `/auth/refresh` (aucune boucle, aucun rejeu auto). En cas de succès, les
 * **deux** cookies sont remplacés et le CSRF renouvelé. En cas d'échec : cookies supprimés + 401
 * générique (sans révéler la cause). Aucun token n'est renvoyé.
 */
export async function handleRefresh(request: Request, deps: AuthHandlerDeps): Promise<Response> {
  const requestId = resolveRequestId(request);

  const methodError = assertPost(request, requestId);
  if (methodError) {
    return methodError;
  }
  const securityError = checkOriginAndCsrf(request, deps, requestId);
  if (securityError) {
    return securityError;
  }

  const adapter = new WebAuthSessionAdapter({ cookieStore: deps.cookieStore, env: deps.env });
  const refreshToken = await adapter.getRefreshToken();
  if (refreshToken === null) {
    await adapter.clearSession().catch(() => undefined);
    return jsonError(401, "UNAUTHENTICATED", "Session invalide.", { requestId });
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
    await client.auth.refresh();
  } catch (error) {
    await adapter.clearSession().catch(() => undefined);
    // Refresh invalide/expiré/révoqué → 401 générique ; indisponibilité API → mapping générique.
    if (error instanceof ApiClientError && (error.status === 401 || error.kind === "session_expired")) {
      return jsonError(401, "UNAUTHENTICATED", "Session expirée.", { requestId });
    }
    return errorResponse(error, requestId);
  }

  await rotateCsrfCookie(deps);
  return jsonOk({ refreshed: true }, { requestId });
}
