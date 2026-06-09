import type { UserProfile } from "./client/auth-bff-client.js";
import { BffAuthError } from "./client/bff-error.js";

/** Erreur d'authentification **publique** (aucune donnée sensible). */
export interface PublicAuthError {
  readonly status?: number;
  readonly errorCode?: string;
  readonly message: string;
  readonly requestId?: string;
}

/**
 * État de session **public** (sans token). Calculé par les hooks à partir de l'état des queries ; aucun
 * `AuthContext` global n'est nécessaire (TanStack Query suffit).
 */
export type SessionState =
  | { readonly status: "loading" }
  | { readonly status: "anonymous" }
  | { readonly status: "authenticated"; readonly user: UserProfile }
  | { readonly status: "error"; readonly error: PublicAuthError };

/** Mappe une erreur en `PublicAuthError` générique (jamais de cause/stack/cookie/token). */
export function toPublicAuthError(error: unknown): PublicAuthError {
  if (error instanceof BffAuthError) {
    let message: string;
    if (error.kind === "network") {
      message = "Service injoignable.";
    } else if (error.kind === "invalid_response") {
      message = "Réponse inattendue du service.";
    } else {
      switch (error.status) {
        case 403:
          message = "Accès refusé.";
          break;
        case 429:
          message = "Trop de requêtes. Réessayez plus tard.";
          break;
        case 500:
        case 502:
        case 503:
          message = "Service indisponible.";
          break;
        default:
          message = "Erreur d'authentification.";
      }
    }
    return {
      status: error.status ?? undefined,
      errorCode: error.errorCode ?? undefined,
      message,
      requestId: error.requestId ?? undefined,
    };
  }
  return { message: "Erreur inattendue." };
}
