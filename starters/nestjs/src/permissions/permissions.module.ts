import { Module } from '@nestjs/common';

import { PermissionsRepository } from './permissions.repository';
import { PermissionsService } from './permissions.service';

/**
 * Module des permissions fines (ADR-006). Opérations internes uniquement (pas de CRUD
 * public). `PrismaService` et `AuditService` sont fournis globalement.
 */
@Module({
  providers: [PermissionsService, PermissionsRepository],
  exports: [PermissionsService],
})
export class PermissionsModule {}
