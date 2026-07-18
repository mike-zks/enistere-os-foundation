/**
 * Type d'événement d'audit : identifiant stable (SCREAMING_SNAKE_CASE) déclaré
 * par le domaine émetteur. L'infrastructure d'audit de la baseline est générique
 * et n'impose aucun registre : chaque capability composée déclare ses propres
 * événements dans son périmètre (ex. `src/auth/auth-audit-events.ts`).
 */
export type AuditEventType = string;

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
