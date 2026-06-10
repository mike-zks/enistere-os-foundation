import { BffAuthError, isRecord } from "./bff-error.js";
import { getCsrfToken } from "./csrf-client.js";

/**
 * Connexion via le **BFF** (`GET /api/auth/csrf` → `POST /api/auth/login`) depuis le navigateur.
 * Appels **same-origin**, `credentials: "include"`. **Aucun token Auth** n'est lu dans la réponse
 * (`accessToken`/`refreshToken`/`Set-Cookie` : jamais accédés) — le BFF pose les cookies `HttpOnly`.
 * Lève `BffAuthError` (HTTP / réseau / réponse invalide) **générique**, sans fuite. Le mot de passe
 * n'est ni journalisé, ni mis en cache : il ne transite que dans le corps de cette requête.
 */
export async function performBffLogin(
  email: string,
  password: string,
  signal?: AbortSignal,
): Promise<void> {
  const csrfToken = await getCsrfToken(signal);

  let response: Response;
  try {
    response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
      signal,
    });
  } catch (cause) {
    if (signal?.aborted) throw cause;
    throw new BffAuthError("network", null, "NETWORK", "Service injoignable.", null);
  }

  const requestId = response.headers.get("x-request-id");
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new BffAuthError("invalid_response", response.status, null, "Réponse invalide.", requestId);
  }

  if (!response.ok) {
    const errorCode = isRecord(body) && typeof body.errorCode === "string" ? body.errorCode : null;
    throw new BffAuthError("http", response.status, errorCode, "Échec de connexion.", requestId);
  }
  if (!isRecord(body) || body.success !== true) {
    throw new BffAuthError("invalid_response", response.status, null, "Réponse invalide.", requestId);
  }
  // Succès : on ne lit **aucun** token (les cookies HttpOnly sont posés par le BFF).
}
