import { ApiClientError, type ApiClientErrorKind } from "@enistere/api-client-fetch";

export interface PublicErrorView {
  /** Message **générique** affichable (jamais de cause/stack/secret). */
  readonly message: string;
  /** Référence de corrélation technique (jamais une preuve de sécurité). */
  readonly requestId: string | null;
  readonly kind: ApiClientErrorKind | "unknown";
  readonly status: number | null;
}

/**
 * Traduit une erreur en vue **publique** : message générique fondé sur `kind`/`status`/`errorCode`,
 * `requestId` conservé séparément. N'expose jamais `cause`, `details` bruts, en-têtes ni secret.
 *
 * 401/403 sont normalisés **sans** workflow d'authentification (aucun refresh, aucune redirection) —
 * la mission Web 2 ne gère aucune session.
 */
export function mapApiErrorToPublicMessage(error: unknown): PublicErrorView {
  if (error instanceof ApiClientError) {
    let message: string;
    switch (error.kind) {
      case "network":
        message = "Service injoignable. Vérifiez votre connexion.";
        break;
      case "timeout":
        message = "Délai dépassé. Réessayez.";
        break;
      case "invalid_response":
        message = "Réponse inattendue du service.";
        break;
      case "session_expired":
        message = "Session expirée.";
        break;
      default:
        message = httpMessage(error.status);
        break;
    }
    return { message, requestId: error.requestId, kind: error.kind, status: error.status };
  }
  return {
    message: "Une erreur inattendue est survenue.",
    requestId: null,
    kind: "unknown",
    status: null,
  };
}

function httpMessage(status: number | null): string {
  switch (status) {
    case 401:
      return "Accès non authentifié.";
    case 403:
      return "Accès refusé.";
    case 404:
      return "Ressource introuvable.";
    case 409:
      return "Conflit de requête.";
    case 413:
      return "Requête trop volumineuse.";
    case 429:
      return "Trop de requêtes. Réessayez plus tard.";
    case 500:
      return "Erreur interne du service.";
    case 503:
      return "Service indisponible.";
    default:
      if (status !== null && status >= 500) {
        return "Erreur du service.";
      }
      return "Requête invalide.";
  }
}
