import { Global, Module } from '@nestjs/common';

import { RuntimeLifecycleService } from './runtime-lifecycle.service';

@Global()
@Module({
  providers: [RuntimeLifecycleService],
  exports: [RuntimeLifecycleService],
})
export class RuntimeLifecycleModule {}
