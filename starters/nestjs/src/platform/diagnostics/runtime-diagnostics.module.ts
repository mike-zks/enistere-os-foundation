import { Global, Module } from '@nestjs/common';

import { RuntimeDiagnosticsService } from './runtime-diagnostics.service';

@Global()
@Module({
  providers: [RuntimeDiagnosticsService],
  exports: [RuntimeDiagnosticsService],
})
export class RuntimeDiagnosticsModule {}
