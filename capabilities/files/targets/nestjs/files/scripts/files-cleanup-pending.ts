/* eslint-disable */
/**
 * Nettoyage des `PENDING` abandonnés (Upload 4) — commande CONTRÔLÉE, NON exécutée au démarrage
 * de l'API et NON incluse dans la suite de tests. Sous-ensemble ciblé de la réconciliation.
 *
 * Dry-run PAR DÉFAUT. `--apply` pour exécuter.
 *
 * Usage :
 *   npm run files:cleanup-pending -- --dry-run
 *   npm run files:cleanup-pending -- --apply --max=50
 *
 * Un PENDING au-delà de FILES_PENDING_EXPIRATION_SECONDS sans objet est marqué REJECTED ;
 * avec objet, il est signalé pour intervention (jamais validé automatiquement).
 */
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../src/app.module';
import { AppLogger } from '../src/common/logging/logging.service';
import {
  FILES_MAINTENANCE_LOCK,
  MaintenanceLockBusyError,
  MaintenanceLockService,
} from '../src/modules/files/maintenance/maintenance-lock.service';
import { FileReconciliationService } from '../src/modules/files/reconciliation/file-reconciliation.service';

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
    const service = app.get(FileReconciliationService);
    const report = await lock.withLock(FILES_MAINTENANCE_LOCK, () => service.cleanupExpiredPending(options));
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
      console.error('Pending cleanup failed.');
      process.exitCode = 1;
    }
  } finally {
    await app.close();
  }
}

void main();
