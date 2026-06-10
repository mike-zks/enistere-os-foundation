import { BffAuthError } from "../../core/auth/client/bff-error.js";

/** Classe d'état UI dérivée d'une erreur Files (mappe vers les états standardisés du Web Core). */
export type FileErrorKind = "notfound" | "forbidden" | "unauthorized" | "unavailable" | "error";

export interface FileError {
  readonly kind: FileErrorKind;
  readonly message: string;
  readonly status?: number;
  readonly requestId?: string;
}

/**
 * Mappe une erreur Files (BFF) en `FileError` **générique** : `404 → notfound` (anti-énumération, aucune
 * mention de propriétaire), `403 → forbidden` (permission **non révélée**), `401 → unauthorized`,
 * `503`/réseau/réponse invalide `→ unavailable` (≠ session anonyme), reste `→ error`. Jamais de fuite
 * (cause/stack/réponse brute/URL signée).
 */
export function classifyFileError(error: unknown): FileError {
  if (error instanceof BffAuthError) {
    const base = { status: error.status ?? undefined, requestId: error.requestId ?? undefined };
    if (error.kind === "network" || error.kind === "invalid_response") {
      return { kind: "unavailable", message: "Service momentanément indisponible.", ...base };
    }
    switch (error.status) {
      case 401:
        return { kind: "unauthorized", message: "Connexion requise.", ...base };
      case 403:
        return { kind: "forbidden", message: "Accès refusé.", ...base };
      case 404:
        return { kind: "notfound", message: "Fichier introuvable.", ...base };
      case 409:
        return { kind: "error", message: "Ce fichier n'est pas téléchargeable.", ...base };
      case 429:
        return { kind: "error", message: "Trop de requêtes. Réessayez plus tard.", ...base };
      case 503:
        return { kind: "unavailable", message: "Stockage temporairement indisponible.", ...base };
      default:
        return { kind: "error", message: "Une erreur est survenue.", ...base };
    }
  }
  return { kind: "error", message: "Une erreur inattendue est survenue." };
}
