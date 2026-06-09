/**
 * Conventions de permissions (ADR-006).
 *
 * Format stable : `resource.action`
 * - minuscules ;
 * - `resource` et `action` en alphanumérique + underscore ;
 * - un seul point séparateur ;
 * - aucune espace ; pas de wildcard `*` en V1.
 *
 * Exemples valides : `users.read`, `roles.manage`, `audit.read`.
 * Exemples invalides : `Users.Read`, `users read`, `users`, `users.*`.
 */
export const PERMISSION_CODE_PATTERN = /^[a-z0-9_]+\.[a-z0-9_]+$/;
const PERMISSION_CODE_MAX_LENGTH = 100;

export function isValidPermissionCode(code: string): boolean {
  return (
    typeof code === 'string' &&
    code.length <= PERMISSION_CODE_MAX_LENGTH &&
    PERMISSION_CODE_PATTERN.test(code)
  );
}

export interface ParsedPermissionCode {
  resource: string;
  action: string;
}

export function parsePermissionCode(code: string): ParsedPermissionCode | null {
  if (!isValidPermissionCode(code)) {
    return null;
  }
  const [resource, action] = code.split('.');
  return { resource, action };
}

/** Normalise un code de rôle : trim + minuscules. */
export function normalizeRoleCode(code: string): string {
  return code.trim().toLowerCase();
}

// --- Données structurelles du core (seed idempotent uniquement, jamais métier) ---

export const SYSTEM_ROLE_CODES = {
  ADMINISTRATOR: 'administrator',
  USER: 'user',
} as const;

/** Permissions structurelles minimales du core (ADR-006 §10, ADR-007 §32). */
export const SYSTEM_PERMISSION_CODES = [
  'users.read',
  'roles.read',
  'roles.manage',
  'permissions.read',
  'permissions.manage',
  'audit.read',
  'files.read',
  'files.upload',
  'files.download',
  'files.delete',
  'files.quarantine',
  'files.restore',
] as const;
