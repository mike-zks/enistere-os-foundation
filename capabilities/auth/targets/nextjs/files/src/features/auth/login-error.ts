import { BffAuthError } from "../../core/auth/client/bff-error.js";
import type { PublicAuthError } from "../../core/auth/session-state.js";

/**
 * Mappe une erreur de connexion en `PublicAuthError` **générique** (jamais de cause/stack/réponse brute/
 * token). **401 ne révèle pas** si l'e-mail existe (message identique « identifiants incorrects »).
 */
export function toLoginError(error: unknown): PublicAuthError {
  if (error instanceof BffAuthError) {
    let message: string;
    if (error.kind === "network") {
      message = "Service injoignable. Réessayez.";
    } else if (error.kind === "invalid_response") {
      message = "Réponse inattendue du service.";
    } else {
      switch (error.status) {
        case 400:
          message = "Requête invalide.";
          break;
        case 401:
          message = "Adresse e-mail ou mot de passe incorrect.";
          break;
        case 403:
          message = "Requête refusée. Rechargez la page et réessayez.";
          break;
        case 413:
          message = "Requête trop volumineuse.";
          break;
        case 429:
          message = "Trop de tentatives. Réessayez plus tard.";
          break;
        case 500:
        case 502:
        case 503:
          message = "Service momentanément indisponible.";
          break;
        default:
          message = "Échec de connexion.";
      }
    }
    return {
      status: error.status ?? undefined,
      errorCode: error.errorCode ?? undefined,
      message,
      requestId: error.requestId ?? undefined,
    };
  }
  return { message: "Échec de connexion." };
}
