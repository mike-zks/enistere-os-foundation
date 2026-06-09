import { Global, Module } from '@nestjs/common';

import { AuditRepository } from './audit.repository';
import { AuditService } from './audit.service';

/**
 * Module d'audit générique. Exposé globalement pour être réutilisé par les modules
 * sensibles (Auth aujourd'hui, autres modules plus tard) sans import répété.
 */
@Global()
@Module({
  providers: [AuditService, AuditRepository],
  exports: [AuditService],
})
export class AuditModule {}
