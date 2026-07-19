// Événements d'audit de la capability Auth. L'infrastructure d'audit de la
// baseline est générique : chaque capability déclare son propre registre.
export const AUTH_AUDIT_EVENTS = {
  AUTH_LOGIN_SUCCEEDED: 'AUTH_LOGIN_SUCCEEDED',
  AUTH_LOGIN_FAILED: 'AUTH_LOGIN_FAILED',
  AUTH_REFRESH_SUCCEEDED: 'AUTH_REFRESH_SUCCEEDED',
  AUTH_REFRESH_FAILED: 'AUTH_REFRESH_FAILED',
  AUTH_REFRESH_REUSE_DETECTED: 'AUTH_REFRESH_REUSE_DETECTED',
  AUTH_LOGOUT: 'AUTH_LOGOUT',
  AUTH_SESSION_FAMILY_REVOKED: 'AUTH_SESSION_FAMILY_REVOKED',
  // Auth 4 : rejets sensibles/anormaux sur routes protégées (pas chaque requête valide).
  AUTH_ACCESS_TOKEN_REJECTED: 'AUTH_ACCESS_TOKEN_REJECTED',
  AUTH_SESSION_REJECTED: 'AUTH_SESSION_REJECTED',
} as const;

export type AuthAuditEvent = (typeof AUTH_AUDIT_EVENTS)[keyof typeof AUTH_AUDIT_EVENTS];
