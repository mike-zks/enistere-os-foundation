/**
 * Erreur normalisée du **client navigateur BFF Auth** (appels same-origin vers `/api/auth/*`).
 * Ne contient jamais de token/cookie ni la réponse brute. `kind` distingue HTTP / réseau / réponse invalide.
 */
export type BffErrorKind = "http" | "network" | "invalid_response";

export class BffAuthError extends Error {
  constructor(
    readonly kind: BffErrorKind,
    readonly status: number | null,
    readonly errorCode: string | null,
    message: string,
    readonly requestId: string | null,
  ) {
    super(message);
    this.name = "BffAuthError";
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
