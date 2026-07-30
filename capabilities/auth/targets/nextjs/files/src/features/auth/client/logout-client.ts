import { BffAuthError } from "./bff-error.js";
import { getCsrfToken } from "./csrf-client.js";

/**
 * Déconnexion via le BFF (`POST /api/auth/logout`) avec jeton CSRF. Le BFF supprime les cookies côté
 * serveur même si l'API NestJS est indisponible : une réponse 2xx est donc considérée comme un logout
 * réussi. Lève `BffAuthError` en cas d'échec (CSRF/origine rejetée, ou réseau navigateur↔BFF).
 */
export async function performBffLogout(signal?: AbortSignal): Promise<void> {
  const csrfToken = await getCsrfToken(signal);

  let response: Response;
  try {
    response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRF-Token": csrfToken, Accept: "application/json" },
      signal,
    });
  } catch (cause) {
    if (signal?.aborted) throw cause;
    throw new BffAuthError("network", null, "NETWORK", "Service injoignable.", null);
  }
  if (!response.ok) {
    throw new BffAuthError("http", response.status, null, "Échec de déconnexion.", response.headers.get("x-request-id"));
  }
}
