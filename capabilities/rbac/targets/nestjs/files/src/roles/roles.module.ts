import { Module } from '@nestjs/common';

import { RolesRepository } from './roles.repository';
import { RolesService } from './roles.service';

/**
 * Module des rôles RBAC (ADR-006). Opérations internes uniquement (pas de CRUD public).
 * `PrismaService` et `AuditService` sont fournis globalement.
 */
@Module({
  providers: [RolesService, RolesRepository],
  exports: [RolesService],
})
export class RolesModule {}
