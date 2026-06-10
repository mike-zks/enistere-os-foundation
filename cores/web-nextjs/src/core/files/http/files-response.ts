import { ApiClientError } from "@enistere/api-client-fetch";

import { jsonError } from "../../auth/http/web-response.js";

/**
 * Réponse BFF Files **générique** (jamais la réponse API brute, ni storageKey/bucket/checksum/URL signée).
 * Préserve **404** (anti-énumération : absent / autre propriétaire / soft-deleted → 404 indistinct) et
 * distingue **409** (non téléchargeable) et **503** (stockage indisponible) — cf. `filesErrorResponse`.
 */
export function filesErrorResponse(error: unknown, requestId?: string): Response {
  if (error instanceof ApiClientError) {
    if (error.kind === "network") {
      return jsonError(502, "API_UNAVAILABLE", "Service indisponible.", { requestId });
    }
    if (error.kind === "timeout") {
      return jsonError(504, "API_TIMEOUT", "Délai dépassé.", { requestId });
    }
    if (error.kind === "session_expired") {
      return jsonError(401, "UNAUTHENTICATED", "Authentification invalide.", { requestId });
    }
    switch (error.status) {
      case 400:
        return jsonError(400, "BAD_REQUEST", "Requête invalide.", { requestId });
      case 401:
        return jsonError(401, "UNAUTHENTICATED", "Authentification invalide.", { requestId });
      case 403:
        return jsonError(403, "FORBIDDEN", "Accès refusé.", { requestId });
      case 404:
        return jsonError(404, "NOT_FOUND", "Fichier introuvable.", { requestId });
      case 409:
        return jsonError(409, "NOT_DOWNLOADABLE", "Fichier non téléchargeable.", { requestId });
      case 429:
        return jsonError(429, "RATE_LIMITED", "Trop de requêtes. Réessayez plus tard.", { requestId });
      case 503:
        return jsonError(503, "STORAGE_UNAVAILABLE", "Stockage temporairement indisponible.", { requestId });
      default:
        if (error.status !== null && error.status >= 500) {
          return jsonError(502, "API_ERROR", "Erreur du service.", { requestId });
        }
        return jsonError(500, "BFF_ERROR", "Erreur interne.", { requestId });
    }
  }
  return jsonError(500, "BFF_ERROR", "Erreur interne.", { requestId });
}
