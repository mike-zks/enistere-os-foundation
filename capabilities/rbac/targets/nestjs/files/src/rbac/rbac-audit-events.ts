// Événements d'audit de la capability RBAC. L'infrastructure d'audit de la
// baseline est générique : chaque capability déclare son propre registre.
export const RBAC_AUDIT_EVENTS = {
  AUTHORIZATION_ROLE_DENIED: 'AUTHORIZATION_ROLE_DENIED',
  AUTHORIZATION_PERMISSION_DENIED: 'AUTHORIZATION_PERMISSION_DENIED',
  ROLE_ASSIGNED: 'ROLE_ASSIGNED',
  ROLE_REMOVED: 'ROLE_REMOVED',
  PERMISSION_ASSIGNED_TO_ROLE: 'PERMISSION_ASSIGNED_TO_ROLE',
  PERMISSION_REMOVED_FROM_ROLE: 'PERMISSION_REMOVED_FROM_ROLE',
} as const;

export type RbacAuditEvent = (typeof RBAC_AUDIT_EVENTS)[keyof typeof RBAC_AUDIT_EVENTS];
