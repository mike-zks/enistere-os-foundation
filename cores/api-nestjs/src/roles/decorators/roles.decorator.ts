import { SetMetadata } from '@nestjs/common';

import { normalizeRoleCode } from '../../permissions/permissions.constants';

/** Clé de metadata des rôles requis. */
export const ROLES_KEY = 'authz:roles';

/**
 * Déclare les rôles requis pour une route. **Sémantique OR** : posséder au moins un
 * des rôles demandés suffit (ADR-006). Au moins un rôle est requis (vérifié au type).
 * Les codes sont normalisés (minuscules).
 */
export const Roles = (...roles: [string, ...string[]]): MethodDecorator & ClassDecorator =>
  SetMetadata(
    ROLES_KEY,
    roles.map((role) => normalizeRoleCode(role)),
  );
