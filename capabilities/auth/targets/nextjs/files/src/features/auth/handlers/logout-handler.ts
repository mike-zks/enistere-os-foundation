import { createAuthenticatedServerApiClient } from "../api/create-authenticated-server-api-client.js";
import { jsonOk } from "../http/web-response.js";
import { WebAuthSessionAdapter } from "../web-session-adapter.js";
import { assertPost, checkOriginAndCsrf, clearCsrfCookie, resolveRequestId } from "./security.js";
import type { AuthHandlerDeps } from "./types.js";

/**
 * `POST /api/auth/logout` (corps vide). **Logout local prioritaire** : appelle l'API logout au mieux
 * (si un refresh token est présent), mais **supprime toujours** les cookies locaux — même si l'API est
 * indisponible. Idempotent. Supprime aussi le cookie CSRF. Aucun token n'est renvoyé.
 */
export async function handleLogout(request: Request, deps: AuthHandlerDeps): Promise<Response> {
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
  try {
    const refreshToken = await adapter.getRefreshToken();
    if (refreshToken !== null) {
      const client = createAuthenticatedServerApiClient({
        cookieStore: deps.cookieStore,
        mode: "writable",
        env: deps.env,
        fetch: deps.fetch,
        baseUrl: deps.baseUrl,
        requestId,
      });
      // Best-effort : une panne API ne doit pas empêcher la suppression locale.
      await client.auth.logout().catch(() => undefined);
    }
  } finally {
    await adapter.clearSession().catch(() => undefined);
    await clearCsrfCookie(deps).catch(() => undefined);
  }

  return jsonOk({ loggedOut: true }, { requestId });
}
