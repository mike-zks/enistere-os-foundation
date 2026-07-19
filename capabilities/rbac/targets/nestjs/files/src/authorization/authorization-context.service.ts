import { Injectable } from '@nestjs/common';

import { PermissionsService } from '../permissions/permissions.service';
import { RolesService } from '../roles/roles.service';

/** Codes de rôles et permissions effectifs de l'utilisateur (jamais persistés ni dans le JWT). */
export interface AuthorizationContext {
  roleCodes: string[];
  permissionCodes: string[];
}

const AUTHORIZATION_CONTEXT_KEY = '__authorizationContext';

/** Porteur du contexte mémoïsé sur la requête (mémoire de requête uniquement). */
export interface AuthorizationCarrier {
  [AUTHORIZATION_CONTEXT_KEY]?: AuthorizationContext;
}

/**
 * Charge le contexte d'autorisation **une seule fois par requête** et le mémoïse sur
 * l'objet requête, afin que RolesGuard et PermissionsGuard ne rejouent pas les requêtes.
 * Le contexte n'est jamais mis dans le JWT ni journalisé.
 */
@Injectable()
export class AuthorizationContextService {
  constructor(
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  /** Charge le contexte (rôles + permissions) sans mémoïsation. */
  async load(userId: string): Promise<AuthorizationContext> {
    const [roleCodes, permissionCodes] = await Promise.all([
      this.rolesService.getUserRoleCodes(userId),
      this.permissionsService.getEffectivePermissions(userId),
    ]);

    return { roleCodes, permissionCodes };
  }

  /** Charge et mémoïse le contexte sur la requête (partagé entre les guards). */
  async forRequest(carrier: AuthorizationCarrier, userId: string): Promise<AuthorizationContext> {
    const cached = carrier[AUTHORIZATION_CONTEXT_KEY];
    if (cached) {
      return cached;
    }

    const context = await this.load(userId);
    carrier[AUTHORIZATION_CONTEXT_KEY] = context;
    return context;
  }
}
