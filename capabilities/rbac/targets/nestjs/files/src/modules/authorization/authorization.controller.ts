import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedPrincipal } from '../auth/contracts/authenticated-principal';
import {
  ApiErrorResponse,
  ApiSuccessResponse,
} from '../../common/openapi/decorators/api-response.decorators';
import { AuthorizationContextService } from './authorization-context.service';
import { AuthorizationSummary } from './contracts/authorization-summary';
import { AuthorizationSummaryResponseDto } from './dto/authorization-summary-response.dto';

/**
 * Résumé d'autorisation de l'utilisateur courant (`GET /auth/me/authorization`).
 *
 * Contrôleur porté par la capability RBAC : il restaure le contrat V1 sans modifier
 * le contrôleur d'Auth (Auth ne dépend pas de RBAC). Le résumé sert l'UI
 * conditionnelle ; il n'est **pas** une preuve d'autorisation réutilisable —
 * l'API reste l'autorité à chaque requête. Les codes sont calculés depuis l'état
 * serveur, jamais depuis une donnée fournie par le client.
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthorizationController {
  constructor(private readonly authorizationContext: AuthorizationContextService) {}

  @Get('me/authorization')
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'auth_getAuthorization',
    summary: 'Rôles et permissions de l’utilisateur courant (UI conditionnelle).',
  })
  @ApiSuccessResponse(AuthorizationSummaryResponseDto, {
    description: 'Rôles et permissions de l’utilisateur courant (codes triés, non réutilisables côté serveur).',
  })
  @ApiErrorResponse(401, 'Authentification requise ou session invalide.')
  @ApiErrorResponse(500, 'Erreur interne.')
  async authorization(@CurrentUser() principal: AuthenticatedPrincipal): Promise<AuthorizationSummary> {
    const context = await this.authorizationContext.load(principal.userId);
    return { roles: context.roleCodes, permissions: context.permissionCodes };
  }
}
