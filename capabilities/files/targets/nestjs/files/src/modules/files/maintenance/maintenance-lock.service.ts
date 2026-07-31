import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AppLogger } from '../../../common/logging/logging.service';
import { PrismaService } from '../../../database/prisma.service';

/** Verrou de maintenance unique : sérialise réconciliation / cleanup / purge (jamais l'API). */
export const FILES_MAINTENANCE_LOCK = 'files:maintenance';

/** Levée quand un autre processus de maintenance détient déjà le verrou (refus, pas d'attente). */
export class MaintenanceLockBusyError extends Error {
  constructor(public readonly lockName: string) {
    super(`Maintenance lock "${lockName}" is already held by another process.`);
    this.name = 'MaintenanceLockBusyError';
  }
}

/**
 * Verrou consultatif PostgreSQL (advisory lock) pour les **commandes de maintenance**
 * (réconciliation, cleanup PENDING, purge). Empêche deux exécutions concurrentes sans attente.
 *
 * - **Niveau session** (`pg_try_advisory_lock`) : ne bloque jamais ; renvoie `false` si déjà tenu.
 * - **N'impacte pas l'API** : aucune route applicative n'acquiert ce verrou (clé dédiée).
 * - **Pas de Redis** : le verrou vit dans PostgreSQL, déjà dépendance du core.
 * - **Backstop** : un verrou non relâché (best-effort) est libéré à la fermeture de la session
 *   PostgreSQL — les commandes étant des **processus courts** qui ferment leur connexion en sortie.
 *
 * Pour les quotas, la sérialisation par propriétaire utilise un verrou **transactionnel**
 * (`pg_advisory_xact_lock`) distinct, côté repository (auto-relâché en fin de transaction).
 */
@Injectable()
export class MaintenanceLockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {}

  /** Tente d'acquérir le verrou nommé sans attendre. `true` si acquis, `false` si déjà tenu. */
  async tryAcquire(lockName: string): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<Array<{ locked: boolean }>>(
      Prisma.sql`SELECT pg_try_advisory_lock(hashtext(${lockName})::bigint) AS locked`,
    );
    return rows[0]?.locked === true;
  }

  /** Libère le verrou nommé (best-effort). */
  async release(lockName: string): Promise<void> {
    await this.prisma.$queryRaw(
      Prisma.sql`SELECT pg_advisory_unlock(hashtext(${lockName})::bigint)`,
    );
  }

  /**
   * Exécute `fn` sous verrou. Lève `MaintenanceLockBusyError` si le verrou est déjà tenu
   * (aucun traitement partiel). Libère toujours dans un `finally`.
   */
  async withLock<T>(lockName: string, fn: () => Promise<T>): Promise<T> {
    const acquired = await this.tryAcquire(lockName);
    if (!acquired) {
      throw new MaintenanceLockBusyError(lockName);
    }
    try {
      return await fn();
    } finally {
      try {
        await this.release(lockName);
      } catch {
        // Best-effort : le verrou sera de toute façon relâché à la fermeture de la session.
        this.logger.warn(
          { context: 'MaintenanceLockService', lockName },
          'Failed to release maintenance lock (released at session close)',
        );
      }
    }
  }
}
