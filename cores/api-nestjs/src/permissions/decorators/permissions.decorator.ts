import { SetMetadata } from '@nestjs/common';

import { isValidPermissionCode } from '../permissions.constants';

/** Clé de metadata des permissions requises. */
export const PERMISSIONS_KEY = 'authz:permissions';

/**
 * Déclare les permissions requises pour une route. **Sémantique AND** : toutes les
 * permissions demandées sont requises (ADR-006). Au moins une permission est requise
 * (vérifié au type) ; les codes invalides sont rejetés dès la déclaration (au démarrage).
 */
export const Permissions = (
  ...permissions: [string, ...string[]]
): MethodDecorator & ClassDecorator => {
  for (const code of permissions) {
    if (!isValidPermissionCode(code)) {
      throw new Error(`Invalid permission code in @Permissions(): ${code}`);
    }
  }

  return SetMetadata(PERMISSIONS_KEY, permissions);
};
