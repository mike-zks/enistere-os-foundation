import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { PrismaTransactionAdapter } from './prisma-transaction.adapter';

describe('PrismaTransactionAdapter', () => {
  it('executes work through Prisma and returns its value', async () => {
    const context = { marker: 'transaction' } as unknown as Prisma.TransactionClient;
    const transactionMock = jest.fn(
      (work: (transaction: Prisma.TransactionClient) => Promise<string>) =>
        work(context),
    );
    const prisma = {
      $transaction: transactionMock,
    } as unknown as PrismaService;
    const adapter = new PrismaTransactionAdapter(prisma);

    await expect(adapter.execute((transaction) => {
      expect(transaction).toBe(context);
      return Promise.resolve('committed');
    })).resolves.toBe('committed');
    expect(transactionMock).toHaveBeenCalledTimes(1);
  });

  it('propagates failures so Prisma can roll back the transaction', async () => {
    const failure = new Error('work failed');
    const prisma = {
      $transaction: jest.fn(
        async (work: (transaction: Prisma.TransactionClient) => Promise<never>) =>
          work({} as Prisma.TransactionClient),
      ),
    } as unknown as PrismaService;
    const adapter = new PrismaTransactionAdapter(prisma);

    await expect(adapter.execute(() => Promise.reject(failure))).rejects.toBe(failure);
  });
});
