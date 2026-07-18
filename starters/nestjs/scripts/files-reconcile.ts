/* eslint-disable */
/**
 * Réconciliation DB ↔ S3/MinIO (Upload 4) — commande CONTRÔLÉE, NON exécutée au démarrage de
 * l'API et NON incluse dans la suite de tests.
 *
 * Dry-run PAR DÉFAUT (rapport des actions proposées, aucune mutation). `--apply` pour exécuter.
 *
 * Usage :
 *   npm run files:reconcile -- --dry-run        (équivaut au défaut)
 *   npm run files:reconcile -- --apply
 *   npm run files:reconcile -- --apply --max=50
 *
 * Le Cloud Core décidera plus tard comment lancer périodiquement cette commande (cron système,
 * CI, orchestrateur). Aucun scheduler n'est embarqué dans l'API (risque multi-instance).
 */
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../src/app.module';
import { AppLogger } from '../src/common/logging/logging.service';
import {
  FILES_MAINTENANCE_LOCK,
  MaintenanceLockBusyError,
  MaintenanceLockService,
} from '../src/files/maintenance/maintenance-lock.service';
import { FileReconciliationService } from '../src/files/reconciliation/file-reconciliation.service';

interface CliOptions {
  dryRun: boolean;
  maxItems?: number;
}

function parseArgs(argv: string[]): CliOptions {
  const apply = argv.includes('--apply');
  const maxArg = argv.find((arg) => arg.startsWith('--max='));
  const parsed = maxArg ? Number(maxArg.slice('--max='.length)) : undefined;
  const maxItems = parsed !== undefined && Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  // Dry-run par défaut : seul `--apply` exécute réellement les actions.
  return { dryRun: !apply, maxItems };
}

async function main(): Promise<void> {
  // Logs techniques → stderr (le résultat machine reste sur stdout, JSON parseable).
  process.env.LOG_STDERR = '1';
  const options = parseArgs(process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: true });
  app.useLogger(app.get(AppLogger));
  try {
    const lock = app.get(MaintenanceLockService);
    const service = app.get(FileReconciliationService);
    // Verrou de maintenance : refuse une seconde exécution concurrente (sans attendre).
    const report = await lock.withLock(FILES_MAINTENANCE_LOCK, () => service.reconcile(options));
    // Sortie sans secret : compteurs + actions proposées/appliquées (clés internes côté opérateur).
    console.log(
      JSON.stringify(
        {
          mode: options.dryRun ? 'dry-run' : 'apply',
          scannedDb: report.scannedDb,
          scannedObjects: report.scannedObjects,
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
      console.error('Reconciliation failed.');
      process.exitCode = 1;
    }
  } finally {
    await app.close();
  }
}

void main();
