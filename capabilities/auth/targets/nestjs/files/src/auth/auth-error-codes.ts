// Codes d'erreur de la capability Auth (format DOMAIN_ERROR_REASON,
// strategy/08_STANDARDS.md §34). Déclarés dans le périmètre de la capability :
// le registre de la baseline (`common/errors/error-codes.ts`) reste générique.
export const AUTH_ERROR_CODES = {
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_ACCOUNT_UNAVAILABLE: 'AUTH_ACCOUNT_UNAVAILABLE',
  AUTH_SESSION_CREATION_FAILED: 'AUTH_SESSION_CREATION_FAILED',
  AUTH_RATE_LIMITED: 'AUTH_RATE_LIMITED',
  // Codes refresh : diagnostic interne/audit. La réponse publique reste générique
  // (AUTH_REFRESH_TOKEN_INVALID pour la majorité des échecs externes).
  AUTH_REFRESH_TOKEN_INVALID: 'AUTH_REFRESH_TOKEN_INVALID',
  AUTH_REFRESH_TOKEN_EXPIRED: 'AUTH_REFRESH_TOKEN_EXPIRED',
  AUTH_REFRESH_TOKEN_REVOKED: 'AUTH_REFRESH_TOKEN_REVOKED',
  AUTH_REFRESH_TOKEN_REUSED: 'AUTH_REFRESH_TOKEN_REUSED',
  AUTH_REFRESH_FAILED: 'AUTH_REFRESH_FAILED',
  AUTH_LOGOUT_FAILED: 'AUTH_LOGOUT_FAILED',
  // Accès protégé (Auth 4). La réponse publique normalise vers AUTH_UNAUTHORIZED ;
  // les autres codes restent du diagnostic interne/audit.
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_ACCESS_TOKEN_INVALID: 'AUTH_ACCESS_TOKEN_INVALID',
  AUTH_ACCESS_TOKEN_EXPIRED: 'AUTH_ACCESS_TOKEN_EXPIRED',
  AUTH_SESSION_INVALID: 'AUTH_SESSION_INVALID',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];
