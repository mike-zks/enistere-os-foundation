import { createAuthenticatedServerApiClient } from "../../api/server/create-authenticated-server-api-client.js";
import { BodyError, readBoundedJsonBody } from "../http/read-body.js";
import { LoginValidationError, parseLoginInput, type LoginInput } from "../http/validate-login.js";
import { errorResponse, jsonError, jsonOk } from "../http/web-response.js";
import { WebAuthSessionAdapter } from "../web-session-adapter.js";
import { assertPost, checkOriginAndCsrf, resolveRequestId, rotateCsrfCookie } from "./security.js";
import type { AuthHandlerDeps } from "./types.js";

/**
 * `POST /api/auth/login`. Ordre : méthode → content-type/corps → Origin/Referer → CSRF → API. En cas
 * de succès, les cookies `HttpOnly` access/refresh sont posés par le `WebAuthSessionAdapter` (via la
 * façade `auth.login`), le CSRF est **renouvelé**, et le corps ne contient **aucun token**.
 */
export async function handleLogin(request: Request, deps: AuthHandlerDeps): Promise<Response> {
  const requestId = resolveRequestId(request);

  const methodError = assertPost(request, requestId);
  if (methodError) {
    return methodError;
  }

  let input: LoginInput;
  try {
    const raw = await readBoundedJsonBody(request);
    input = parseLoginInput(raw);
  } catch (error) {
    if (error instanceof BodyError) {
      const status = error.code === "too_large" ? 413 : error.code === "invalid_content_type" ? 415 : 400;
      return jsonError(status, "INVALID_REQUEST", "Requête invalide.", { requestId });
    }
    if (error instanceof LoginValidationError) {
      return jsonError(400, "INVALID_REQUEST", "Requête invalide.", { requestId });
    }
    return jsonError(400, "BAD_REQUEST", "Requête invalide.", { requestId });
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
    await client.auth.login(input.email, input.password);
  } catch (error) {
    // Compensation : si la pose des cookies a partiellement échoué, ne laisser aucune session partielle.
    await new WebAuthSessionAdapter({ cookieStore: deps.cookieStore, env: deps.env })
      .clearSession()
      .catch(() => undefined);
    return errorResponse(error, requestId);
  }

  // Rotation CSRF après login réussi (l'ancien jeton ne sera plus accepté).
  await rotateCsrfCookie(deps);

  return jsonOk({ authenticated: true }, { requestId });
}
