import { Module } from '@nestjs/common';

import { PermissionsModule } from '../../permissions/permissions.module';
import { RolesModule } from '../../roles/roles.module';
import { AuthorizationContextService } from './authorization-context.service';

/**
 * Agrège rôles et permissions en un contexte d'autorisation chargé une fois par requête.
 * Importé par AppModule pour fournir les dépendances des guards globaux d'autorisation.
 */
@Module({
  imports: [RolesModule, PermissionsModule],
  providers: [AuthorizationContextService],
  exports: [AuthorizationContextService],
})
export class AuthorizationModule {}
