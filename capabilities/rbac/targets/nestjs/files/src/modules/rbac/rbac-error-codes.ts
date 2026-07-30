// Codes d'erreur de la capability RBAC (format DOMAIN_ERROR_REASON,
// Platform Contract, ADR-048). Déclarés dans le périmètre de la capability :
// le registre de la baseline reste générique et celui d'Auth ne porte que
// l'authentification. `AUTH_FORBIDDEN` est la réponse publique d'autorisation (403).
export const RBAC_ERROR_CODES = {
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
  ROLE_NOT_FOUND: 'ROLE_NOT_FOUND',
  ROLE_CODE_ALREADY_EXISTS: 'ROLE_CODE_ALREADY_EXISTS',
  PERMISSION_NOT_FOUND: 'PERMISSION_NOT_FOUND',
  PERMISSION_CODE_ALREADY_EXISTS: 'PERMISSION_CODE_ALREADY_EXISTS',
  INVALID_PERMISSION_CODE: 'INVALID_PERMISSION_CODE',
} as const;

export type RbacErrorCode = (typeof RBAC_ERROR_CODES)[keyof typeof RBAC_ERROR_CODES];
