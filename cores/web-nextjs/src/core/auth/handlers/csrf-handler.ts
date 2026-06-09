import { jsonError, jsonOk } from "../http/web-response.js";
import { rotateCsrfCookie, resolveRequestId } from "./security.js";
import type { AuthHandlerDeps } from "./types.js";

/**
 * `GET /api/auth/csrf` — bootstrap CSRF. Génère/renouvelle le cookie CSRF (non HttpOnly) et renvoie le
 * jeton dans le corps (**seul** jeton volontairement lisible par le JS). Aucun token Auth, `no-store`,
 * `Referrer-Policy: no-referrer`.
 */
export async function handleCsrf(request: Request, deps: AuthHandlerDeps): Promise<Response> {
  const requestId = resolveRequestId(request);
  if (request.method !== "GET") {
    return jsonError(405, "METHOD_NOT_ALLOWED", "Méthode non autorisée.", { requestId });
  }
  const csrfToken = await rotateCsrfCookie(deps);
  return jsonOk(
    { csrfToken },
    { requestId, extraHeaders: { "Referrer-Policy": "no-referrer" } },
  );
}
