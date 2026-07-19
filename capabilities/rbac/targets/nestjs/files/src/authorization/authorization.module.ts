import { Module } from '@nestjs/common';

import { PermissionsModule } from '../permissions/permissions.module';
import { RolesModule } from '../roles/roles.module';
import { AuthorizationContextService } from './authorization-context.service';
import { AuthorizationController } from './authorization.controller';

/**
 * Capability RBAC — agrège rôles et permissions en un contexte d'autorisation
 * chargé une fois par requête, expose le résumé d'autorisation de l'utilisateur
 * courant, et fournit les dépendances des guards globaux d'autorisation.
 *
 * Composé par-dessus Auth : RBAC dépend d'Auth (principal authentifié), jamais
 * l'inverse.
 */
@Module({
  imports: [RolesModule, PermissionsModule],
  controllers: [AuthorizationController],
  providers: [AuthorizationContextService],
  exports: [AuthorizationContextService],
})
export class AuthorizationModule {}
