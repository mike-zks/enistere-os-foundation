import { buildCsrfCookieOptions, csrfCookieName } from "../csrf/csrf-cookie.js";
import { generateCsrfToken, validateCsrfToken } from "../csrf/csrf-token.js";
import { validateRequestOrigin } from "../http/allowed-origins.js";
import { jsonError } from "../http/web-response.js";
import { resolveRequestId as resolveRequestIdValue } from "../request-id.js";
import type { AuthHandlerDeps } from "./types.js";

/** Identifiant de corrélation : réutilise un `X-Request-Id` entrant valide, sinon en génère un. */
export function resolveRequestId(request: Request): string {
  return resolveRequestIdValue(request.headers.get("x-request-id"));
}

/** Refuse toute méthode autre que POST (générique 405). */
export function assertPost(request: Request, requestId: string): Response | null {
  if (request.method === "POST") {
    return null;
  }
  return jsonError(405, "METHOD_NOT_ALLOWED", "Méthode non autorisée.", { requestId });
}

/** Refuse toute méthode autre que DELETE (générique 405). */
export function assertDelete(request: Request, requestId: string): Response | null {
  if (request.method === "DELETE") {
    return null;
  }
  return jsonError(405, "METHOD_NOT_ALLOWED", "Méthode non autorisée.", { requestId });
}

/**
 * Vérifie l'**origine** (Origin sinon Referer, fail-closed) puis le **CSRF** (double-submit). Retourne
 * une réponse 403 générique en cas d'échec, ou `null` si tout est valide. **Aucun appel API** ne doit
 * être fait avant que cette vérification ait réussi.
 */
export function checkOriginAndCsrf(
  request: Request,
  deps: AuthHandlerDeps,
  requestId: string,
): Response | null {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  if (!validateRequestOrigin({ origin, referer }, deps.allowedOrigins)) {
    return jsonError(403, "ORIGIN_REJECTED", "Origine refusée.", { requestId });
  }
  const cookieToken = deps.cookieStore.get(csrfCookieName(deps.env));
  const headerToken = request.headers.get("x-csrf-token");
  if (!validateCsrfToken(cookieToken, headerToken)) {
    return jsonError(403, "CSRF_REJECTED", "Jeton CSRF invalide.", { requestId });
  }
  return null;
}

/** Renouvelle le cookie CSRF (rotation après login/refresh). Retourne le nouveau jeton. */
export async function rotateCsrfCookie(deps: AuthHandlerDeps): Promise<string> {
  const token = generateCsrfToken();
  await deps.cookieStore.set(csrfCookieName(deps.env), token, buildCsrfCookieOptions(deps.env));
  return token;
}

/** Supprime le cookie CSRF (logout). Idempotent. */
export async function clearCsrfCookie(deps: AuthHandlerDeps): Promise<void> {
  await deps.cookieStore.delete(csrfCookieName(deps.env));
}
