import type { SchemaOf } from "@enistere/api-contracts";

import { bffGet } from "../auth/client/auth-bff-client.js";

/**
 * Client navigateur RBAC : lit le résumé d'autorisation via le **BFF** same-origin
 * (`/api/auth/authorization`), en réutilisant la primitive d'Auth (`credentials: include`,
 * cookies `HttpOnly` jamais lus par le JS, aucune URL d'API directe, aucun token).
 *
 * Le résumé sert l'UX conditionnelle uniquement : l'API reste l'autorité d'autorisation.
 */
export type AuthorizationSummary = SchemaOf<"AuthorizationSummaryResponseDto">;

/** `GET /api/auth/authorization` → rôles/permissions publics de l'utilisateur courant. */
export function fetchAuthorization(signal?: AbortSignal): Promise<AuthorizationSummary> {
  return bffGet<AuthorizationSummary>("/api/auth/authorization", signal);
}
