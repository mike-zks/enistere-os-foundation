import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { FilesRepository } from './files.repository';

describe('FilesRepository', () => {
  let delegate: {
    create: jest.Mock;
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
  };
  let repository: FilesRepository;

  beforeEach(() => {
    delegate = {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    };
    repository = new FilesRepository({ storedFile: delegate } as unknown as PrismaService);
  });

  it('create delegates to prisma.storedFile.create', async () => {
    const data = {} as Prisma.StoredFileCreateInput;
    await repository.create(data);
    expect(delegate.create).toHaveBeenCalledWith({ data });
  });

  it('findByIdAndOwner restricts to owner and non-deleted', async () => {
    delegate.findFirst.mockResolvedValue(null);
    await repository.findByIdAndOwner('file-1', 'user-1');
    expect(delegate.findFirst).toHaveBeenCalledWith({
      where: { id: 'file-1', ownerId: 'user-1', deletedAt: null },
    });
  });

  it('existsByStorageKey selects only the id', async () => {
    delegate.findUnique.mockResolvedValue({ id: 'x' });
    await expect(repository.existsByStorageKey('k')).resolves.toBe(true);
    expect(delegate.findUnique).toHaveBeenCalledWith({ where: { storageKey: 'k' }, select: { id: true } });
  });

  it('markDeleted sets status DELETED and deletedAt', async () => {
    delegate.update.mockResolvedValue({});
    await repository.markDeleted('file-1');
    const arg = delegate.update.mock.calls[0][0];
    expect(arg.where).toEqual({ id: 'file-1' });
    expect(arg.data.status).toBe('DELETED');
    expect(arg.data.deletedAt).toBeInstanceOf(Date);
  });

  it('reject sets status REJECTED and rejectedAt', async () => {
    delegate.update.mockResolvedValue({});
    await repository.reject('file-1');
    const arg = delegate.update.mock.calls[0][0];
    expect(arg.data.status).toBe('REJECTED');
    expect(arg.data.rejectedAt).toBeInstanceOf(Date);
  });

  it('listByOwner filters non-deleted and paginates', async () => {
    delegate.findMany.mockResolvedValue([]);
    await repository.listByOwner('user-1', 0, 20);
    const arg = delegate.findMany.mock.calls[0][0];
    expect(arg.where).toEqual({ ownerId: 'user-1', deletedAt: null });
    expect(arg.skip).toBe(0);
    expect(arg.take).toBe(20);
  });
});
