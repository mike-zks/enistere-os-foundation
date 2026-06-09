/** Types d'événements d'audit. Génériques, sans logique métier. */
export const AUDIT_EVENT_TYPES = {
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
  // Auth 5 : refus d'autorisation et modifications d'affectation RBAC.
  AUTHORIZATION_ROLE_DENIED: 'AUTHORIZATION_ROLE_DENIED',
  AUTHORIZATION_PERMISSION_DENIED: 'AUTHORIZATION_PERMISSION_DENIED',
  ROLE_ASSIGNED: 'ROLE_ASSIGNED',
  ROLE_REMOVED: 'ROLE_REMOVED',
  PERMISSION_ASSIGNED_TO_ROLE: 'PERMISSION_ASSIGNED_TO_ROLE',
  PERMISSION_REMOVED_FROM_ROLE: 'PERMISSION_REMOVED_FROM_ROLE',
  // Fichiers (ADR-007, Upload 1). Aucune donnée de contenu/credential/URL signée.
  FILE_PENDING_CREATED: 'FILE_PENDING_CREATED',
  FILE_METADATA_VALIDATED: 'FILE_METADATA_VALIDATED',
  FILE_REJECTED: 'FILE_REJECTED',
  FILE_MARKED_DELETED: 'FILE_MARKED_DELETED',
  // Upload 2 (multipart + stockage objet).
  FILE_UPLOAD_STARTED: 'FILE_UPLOAD_STARTED',
  FILE_UPLOADED: 'FILE_UPLOADED',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  FILE_STORAGE_COMPENSATION_FAILED: 'FILE_STORAGE_COMPENSATION_FAILED',
  FILE_ORPHANED_OBJECT_DETECTED: 'FILE_ORPHANED_OBJECT_DETECTED',
  // Upload 3 (consultation + URLs signées de lecture). Jamais d'URL signée, de query de
  // signature, de storageKey, de bucket ni de checksum dans les métadonnées d'audit.
  FILE_METADATA_ACCESSED: 'FILE_METADATA_ACCESSED',
  FILE_DOWNLOAD_URL_ISSUED: 'FILE_DOWNLOAD_URL_ISSUED',
  FILE_DOWNLOAD_URL_DENIED: 'FILE_DOWNLOAD_URL_DENIED',
  FILE_STORAGE_OBJECT_MISSING: 'FILE_STORAGE_OBJECT_MISSING',
  // Upload 4 (suppression, quarantaine, réconciliation). Pour les traitements batch :
  // événements résumés + compteurs, jamais un événement par objet sans politique.
  FILE_DELETION_REQUESTED: 'FILE_DELETION_REQUESTED',
  FILE_OBJECT_DELETED: 'FILE_OBJECT_DELETED',
  FILE_DELETED: 'FILE_DELETED',
  FILE_DELETION_FAILED: 'FILE_DELETION_FAILED',
  FILE_DATABASE_FINALIZATION_FAILED: 'FILE_DATABASE_FINALIZATION_FAILED',
  FILE_QUARANTINED: 'FILE_QUARANTINED',
  FILE_QUARANTINE_RELEASED: 'FILE_QUARANTINE_RELEASED',
  FILE_RECONCILIATION_STARTED: 'FILE_RECONCILIATION_STARTED',
  FILE_RECONCILIATION_COMPLETED: 'FILE_RECONCILIATION_COMPLETED',
  FILE_RECONCILIATION_ACTION: 'FILE_RECONCILIATION_ACTION',
  FILE_PENDING_EXPIRED: 'FILE_PENDING_EXPIRED',
  FILE_ORPHAN_DELETED: 'FILE_ORPHAN_DELETED',
  // Upload 5 (quotas). Audité uniquement sur dépassement (jamais sur vérification réussie).
  FILE_QUOTA_EXCEEDED: 'FILE_QUOTA_EXCEEDED',
} as const;

export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[keyof typeof AUDIT_EVENT_TYPES];

/**
 * Événement d'audit. Les métadonnées sont volontairement limitées à des valeurs
 * primitives non sensibles (jamais de token, hash, mot de passe ni payload complet).
 */
export interface AuditEvent {
  eventType: AuditEventType;
  actorId?: string | null;
  subjectId?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: Record<string, string | number | boolean | null> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}
