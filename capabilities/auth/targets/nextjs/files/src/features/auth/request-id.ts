/**
 * Identifiant de corrélation (request id). Logique **pure** (sans Next, sans `Request`) → testable et
 * réutilisable côté Route Handler (depuis un `Request`) **et** côté Server Component (depuis `headers()`).
 *
 * Réutilise un identifiant entrant **valide** (charset/longueur bornés) ; sinon en génère un (UUID v4).
 * Source unique pour éviter deux systèmes incompatibles.
 */
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{1,200}$/;

/** Vrai si la valeur est un request id entrant acceptable. */
export function isValidRequestId(value: string | null | undefined): value is string {
  return typeof value === "string" && REQUEST_ID_PATTERN.test(value);
}

/** Retourne l'identifiant entrant s'il est valide, sinon un UUID généré. */
export function resolveRequestId(incoming: string | null | undefined): string {
  return isValidRequestId(incoming) ? incoming : crypto.randomUUID();
}
