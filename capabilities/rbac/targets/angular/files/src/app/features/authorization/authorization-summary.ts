/** Résumé public calculé par l’autorité pour le principal courant. */
export interface AuthorizationSummary {
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
}

/** Erreur minimale observable par l’UI, sans corps serveur ni créance. */
export interface PublicAuthorizationError {
  readonly code: string;
  readonly requestId: string | null;
}
