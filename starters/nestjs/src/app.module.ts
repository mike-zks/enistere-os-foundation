import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { AuditModule } from './audit/audit.module';
import { LoggingModule } from './common/logging/logging.module';
import { ThrottlingModule } from './common/throttling/throttling.module';
import { CAPABILITY_GLOBAL_GUARDS, CAPABILITY_MODULES } from './composition/capabilities';
import { configuration } from './config/configuration';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { RuntimeExtensionModule } from './platform/extensions/runtime-extension.module';
import { RuntimeDiagnosticsModule } from './platform/diagnostics/runtime-diagnostics.module';
import { RuntimeLifecycleModule } from './platform/lifecycle/runtime-lifecycle.module';
import { RuntimeObservabilityModule } from './platform/observability/runtime-observability.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    RuntimeDiagnosticsModule,
    RuntimeObservabilityModule,
    LoggingModule,
    DatabaseModule,
    ThrottlingModule,
    AuditModule,
    HealthModule,
    RuntimeExtensionModule,
    RuntimeLifecycleModule,
    // Modules des capabilities composées (fichier de composition généré par la Factory ;
    // vide dans le Platform Baseline).
    ...CAPABILITY_MODULES,
  ],
  // Guards globaux fournis par les capabilities composées, dans l'ordre de composition
  // (authentification avant autorisation). Aucun guard global dans la baseline.
  providers: CAPABILITY_GLOBAL_GUARDS.map((guard) => ({ provide: APP_GUARD, useClass: guard })),
})
export class AppModule {}
