// Codes d'erreur au format DOMAIN_ERROR_REASON (Platform Contract, ADR-048).
//
// Ce registre ne contient que les codes transverses de la baseline `base`.
// Chaque capability composée déclare ses propres codes dans son périmètre
// (ex. `src/auth/auth-error-codes.ts` pour Auth) : la baseline ne référence
// jamais un domaine qu'elle n'embarque pas.
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
