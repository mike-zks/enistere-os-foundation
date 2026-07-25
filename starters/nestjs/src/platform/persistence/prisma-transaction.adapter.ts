import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { TransactionPort } from './transaction.port';

/** Prisma implementation kept behind the neutral TransactionPort. */
@Injectable()
export class PrismaTransactionAdapter implements TransactionPort<Prisma.TransactionClient> {
  constructor(private readonly prisma: PrismaService) {}

  execute<Result>(
    work: (context: Prisma.TransactionClient) => Promise<Result>,
  ): Promise<Result> {
    return this.prisma.$transaction((transaction) => work(transaction));
  }
}
