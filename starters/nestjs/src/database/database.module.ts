import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';
import { PrismaTransactionAdapter } from '../platform/persistence/prisma-transaction.adapter';
import { TRANSACTION_PORT } from '../platform/persistence/transaction.port';

@Global()
@Module({
  providers: [
    PrismaService,
    PrismaTransactionAdapter,
    { provide: TRANSACTION_PORT, useExisting: PrismaTransactionAdapter },
  ],
  exports: [PrismaService, TRANSACTION_PORT],
})
export class DatabaseModule {}
