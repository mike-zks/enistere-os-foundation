import { Prisma, User, UserStatus } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';
import { UsersRepository } from './users.repository';

describe('UsersRepository', () => {
  const baseUser: User = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'user@example.com',
    passwordHash: 'already-hashed-secret',
    status: UserStatus.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    deactivatedAt: null,
  };

  let userDelegate: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
  let repository: UsersRepository;

  beforeEach(() => {
    userDelegate = {
      findUnique: jest.fn(),
      create: jest.fn(),
    };
    repository = new UsersRepository({ user: userDelegate } as unknown as PrismaService);
  });

  it('findByEmail queries prisma by email', async () => {
    userDelegate.findUnique.mockResolvedValue(baseUser);

    const result = await repository.findByEmail('user@example.com');

    expect(userDelegate.findUnique).toHaveBeenCalledWith({ where: { email: 'user@example.com' } });
    expect(result).toBe(baseUser);
  });

  it('findById queries prisma by id', async () => {
    userDelegate.findUnique.mockResolvedValue(baseUser);

    await repository.findById(baseUser.id);

    expect(userDelegate.findUnique).toHaveBeenCalledWith({ where: { id: baseUser.id } });
  });

  it('create delegates to prisma.user.create', async () => {
    userDelegate.create.mockResolvedValue(baseUser);
    const data: Prisma.UserCreateInput = {
      email: 'user@example.com',
      passwordHash: 'already-hashed-secret',
    };

    const result = await repository.create(data);

    expect(userDelegate.create).toHaveBeenCalledWith({ data });
    expect(result).toBe(baseUser);
  });

  describe('existsByEmail', () => {
    it('returns true and selects only the id when a user exists', async () => {
      userDelegate.findUnique.mockResolvedValue({ id: baseUser.id });

      await expect(repository.existsByEmail('user@example.com')).resolves.toBe(true);
      expect(userDelegate.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
        select: { id: true },
      });
    });

    it('returns false when no user exists', async () => {
      userDelegate.findUnique.mockResolvedValue(null);

      await expect(repository.existsByEmail('missing@example.com')).resolves.toBe(false);
    });
  });
});
