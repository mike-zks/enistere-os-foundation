import { Global, Module } from '@nestjs/common';

import { RuntimeExtensionRegistry } from './runtime-extension.contract';

@Global()
@Module({
  providers: [RuntimeExtensionRegistry],
  exports: [RuntimeExtensionRegistry],
})
export class RuntimeExtensionModule {}
