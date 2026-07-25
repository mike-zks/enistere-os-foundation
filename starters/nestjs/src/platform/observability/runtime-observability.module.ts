import { Global, Module } from '@nestjs/common';

import { RuntimeTelemetryService } from './runtime-telemetry.service';

@Global()
@Module({
  providers: [RuntimeTelemetryService],
  exports: [RuntimeTelemetryService],
})
export class RuntimeObservabilityModule {}
