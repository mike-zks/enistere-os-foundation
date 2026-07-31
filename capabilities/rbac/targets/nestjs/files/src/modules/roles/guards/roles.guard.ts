import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuditService } from '../../../audit/audit.service';
import { RBAC_AUDIT_EVENTS } from '../../rbac/rbac-audit-events';
import {
  AuthorizationCarrier,
  AuthorizationContextService,
} from '../../authorization/authorization-context.service';
import { AuthenticatedPrincipal } from '../../auth/contracts/authenticated-principal';
import { RBAC_ERROR_CODES } from '../../rbac/rbac-error-codes';
import { ROLES_KEY } from '../decorators/roles.decorator';

type GuardRequest = AuthorizationCarrier & { user?: AuthenticatedPrincipal; ip?: string };

/**
 * Guard global conditionnel : n'agit que si `@Roles()` est présent. Logique **OR**
 * (au moins un rôle requis possédé). Charge les rôles côté serveur (jamais le client,
 * jamais le JWT). Refus → 403 générique (`AUTH_FORBIDDEN`) + audit.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationContext: AuthorizationContextService,
    private readonly auditService: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<GuardRequest>();
    const principal = request.user;

    if (!principal) {
      // Configuration incohérente (ex. @Public() combiné à @Roles()) : on refuse de
      // manière sûre plutôt que d'exposer la route.
      throw new InternalServerErrorException(
        'Authorization requires authentication: do not combine @Public() with @Roles().',
      );
    }

    const authorization = await this.authorizationContext.forRequest(request, principal.userId);
    const allowed = required.some((role) => authorization.roleCodes.includes(role));

    if (!allowed) {
      await this.auditService.record({
        eventType: RBAC_AUDIT_EVENTS.AUTHORIZATION_ROLE_DENIED,
        subjectId: principal.userId,
        ipAddress: request.ip ?? null,
        metadata: { requiredRoles: required.join(',') },
      });
      throw new ForbiddenException({ code: RBAC_ERROR_CODES.AUTH_FORBIDDEN, message: 'Forbidden.' });
    }

    return true;
  }
}
