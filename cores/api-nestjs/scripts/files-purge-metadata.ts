/* eslint-disable */
/**
 * Purge PHYSIQUE contrôlée des métadonnées (Upload 5) — commande CONTRÔLÉE, NON exécutée au
 * démarrage de l'API et NON incluse dans la suite de tests.
 *
 * Supprime les lignes `DELETED`/`REJECTED` dont la rétention est dépassée ET dont aucun objet
 * n'est présent. Dry-run PAR DÉFAUT. `--apply` pour exécuter. Sous verrou de maintenance.
 *
 * Usage :
 *   npm run files:purge-metadata -- --dry-run
 *   npm run files:purge-metadata -- --apply [--max=N]
 *
 * Ne supprime JAMAIS les `AuditLog`. Si l'objet existe encore, la ligne n'est pas purgée
 * (incohérence signalée : lancer la réconciliation d'abord).
 */
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../src/app.module';
import { AppLogger } from '../src/common/logging/logging.service';
import {
  FILES_MAINTENANCE_LOCK,
  MaintenanceLockBusyError,
  MaintenanceLockService,
} from '../src/files/maintenance/maintenance-lock.service';
import { FilePurgeService } from '../src/files/reconciliation/file-purge.service';

interface CliOptions {
  dryRun: boolean;
  maxItems?: number;
}

function parseArgs(argv: string[]): CliOptions {
  const apply = argv.includes('--apply');
  const maxArg = argv.find((arg) => arg.startsWith('--max='));
  const parsed = maxArg ? Number(maxArg.slice('--max='.length)) : undefined;
  const maxItems = parsed !== undefined && Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  return { dryRun: !apply, maxItems };
}

async function main(): Promise<void> {
  process.env.LOG_STDERR = '1';
  const options = parseArgs(process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: true });
  app.useLogger(app.get(AppLogger));
  try {
    const lock = app.get(MaintenanceLockService);
    const service = app.get(FilePurgeService);
    const report = await lock.withLock(FILES_MAINTENANCE_LOCK, () => service.purgeMetadata(options));
    console.log(
      JSON.stringify(
        {
          mode: options.dryRun ? 'dry-run' : 'apply',
          scannedDb: report.scannedDb,
          counts: report.counts,
          actions: report.actions,
        },
        null,
        2,
      ),
    );
    process.exitCode = 0;
  } catch (error) {
    if (error instanceof MaintenanceLockBusyError) {
      console.error('Another maintenance command is already running. Aborted (no work done).');
      process.exitCode = 2;
    } else {
      console.error('Metadata purge failed.');
      process.exitCode = 1;
    }
  } finally {
    await app.close();
  }
}

void main();
