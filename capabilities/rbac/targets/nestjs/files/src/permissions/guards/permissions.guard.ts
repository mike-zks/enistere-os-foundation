import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuditService } from '../../audit/audit.service';
import { AUDIT_EVENT_TYPES } from '../../audit/audit.types';
import {
  AuthorizationCarrier,
  AuthorizationContextService,
} from '../../auth/authorization/authorization-context.service';
import { AuthenticatedPrincipal } from '../../auth/contracts/authenticated-principal';
import { ERROR_CODES } from '../../common/errors/error-codes';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

type GuardRequest = AuthorizationCarrier & { user?: AuthenticatedPrincipal; ip?: string };

/**
 * Guard global conditionnel : n'agit que si `@Permissions()` est présent. Logique **AND**
 * (toutes les permissions requises). Deny by default. Charge les permissions côté serveur.
 * Refus → 403 générique (`AUTH_FORBIDDEN`) sans révéler la permission manquante + audit.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationContext: AuthorizationContextService,
    private readonly auditService: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<GuardRequest>();
    const principal = request.user;

    if (!principal) {
      throw new InternalServerErrorException(
        'Authorization requires authentication: do not combine @Public() with @Permissions().',
      );
    }

    const authorization = await this.authorizationContext.forRequest(request, principal.userId);
    const granted = new Set(authorization.permissionCodes);
    const allowed = required.every((permission) => granted.has(permission));

    if (!allowed) {
      await this.auditService.record({
        eventType: AUDIT_EVENT_TYPES.AUTHORIZATION_PERMISSION_DENIED,
        subjectId: principal.userId,
        ipAddress: request.ip ?? null,
        metadata: { requiredPermissions: required.join(',') },
      });
      throw new ForbiddenException({ code: ERROR_CODES.AUTH_FORBIDDEN, message: 'Forbidden.' });
    }

    return true;
  }
}
