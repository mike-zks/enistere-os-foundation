import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AppLogger } from '../common/logging/logging.service';
import { AuditRepository } from './audit.repository';
import { AuditEvent } from './audit.types';

/**
 * Enregistre les événements d'audit des actions sensibles (CORE_SPEC §19).
 *
 * Ne persiste jamais de token, hash, mot de passe ni payload complet. Un échec de
 * persistance d'audit ne doit jamais interrompre le flux appelant ni exposer de secret.
 */
@Injectable()
export class AuditService {
  constructor(
    private readonly repository: AuditRepository,
    private readonly logger: AppLogger,
  ) {}

  async record(event: AuditEvent): Promise<void> {
    try {
      const data: Prisma.AuditLogCreateInput = {
        eventType: event.eventType,
        actorId: event.actorId ?? null,
        subjectId: event.subjectId ?? null,
        resourceType: event.resourceType ?? null,
        resourceId: event.resourceId ?? null,
        ipAddress: event.ipAddress ?? null,
        userAgent: event.userAgent ?? null,
      };

      if (event.metadata) {
        data.metadata = event.metadata;
      }

      await this.repository.create(data);
    } catch {
      // Volontairement silencieux côté flux appelant ; aucun secret dans le log.
      this.logger.warn(
        { context: 'AuditService', eventType: event.eventType },
        'Failed to persist audit event',
      );
    }
  }
}
