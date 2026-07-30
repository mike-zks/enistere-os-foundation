import { ConflictException } from '@nestjs/common';
import { Prisma, User, UserStatus } from '@prisma/client';

import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const baseUser: User = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'user@example.com',
    passwordHash: 'already-hashed-secret',
    status: UserStatus.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    deactivatedAt: null,
  };

  let repository: {
    findByEmail: jest.Mock<Promise<User | null>, [string]>;
    findById: jest.Mock<Promise<User | null>, [string]>;
    create: jest.Mock<Promise<User>, [Prisma.UserCreateInput]>;
    existsByEmail: jest.Mock<Promise<boolean>, [string]>;
  };
  let service: UsersService;

  beforeEach(() => {
    repository = {
      findByEmail: jest.fn<Promise<User | null>, [string]>(),
      findById: jest.fn<Promise<User | null>, [string]>(),
      create: jest.fn<Promise<User>, [Prisma.UserCreateInput]>(),
      existsByEmail: jest.fn<Promise<boolean>, [string]>(),
    };
    service = new UsersService(repository as unknown as UsersRepository);
  });

  describe('normalizeEmail', () => {
    it('trims and lowercases the email', () => {
      expect(UsersService.normalizeEmail('  User@Example.COM ')).toBe('user@example.com');
    });
  });

  describe('findByEmail', () => {
    it('normalizes the email and returns a public user without passwordHash', async () => {
      repository.findByEmail.mockResolvedValue(baseUser);

      const result = await service.findByEmail('  User@Example.com ');

      expect(repository.findByEmail).toHaveBeenCalledWith('user@example.com');
      expect(result).not.toBeNull();
      expect(result?.id).toBe(baseUser.id);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('returns null when the user is not found', async () => {
      repository.findByEmail.mockResolvedValue(null);

      await expect(service.findByEmail('missing@example.com')).resolves.toBeNull();
    });
  });

  describe('findById', () => {
    it('returns a public user without passwordHash', async () => {
      repository.findById.mockResolvedValue(baseUser);

      const result = await service.findById(baseUser.id);

      expect(repository.findById).toHaveBeenCalledWith(baseUser.id);
      expect(result?.email).toBe(baseUser.email);
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('findAuthUserByEmail', () => {
    it('returns the passwordHash for authentication usage', async () => {
      repository.findByEmail.mockResolvedValue(baseUser);

      const result = await service.findAuthUserByEmail('USER@example.com');

      expect(repository.findByEmail).toHaveBeenCalledWith('user@example.com');
      expect(result?.passwordHash).toBe(baseUser.passwordHash);
    });
  });

  describe('emailExists', () => {
    it('delegates to the repository with the normalized email', async () => {
      repository.existsByEmail.mockResolvedValue(true);

      await expect(service.emailExists(' User@Example.com ')).resolves.toBe(true);
      expect(repository.existsByEmail).toHaveBeenCalledWith('user@example.com');
    });
  });

  describe('createUser', () => {
    it('creates a user with a normalized email and returns it without passwordHash', async () => {
      repository.existsByEmail.mockResolvedValue(false);
      repository.create.mockResolvedValue(baseUser);

      const result = await service.createUser({
        email: '  User@Example.com ',
        passwordHash: 'already-hashed-secret',
      });

      expect(repository.existsByEmail).toHaveBeenCalledWith('user@example.com');
      expect(repository.create).toHaveBeenCalledWith({
        email: 'user@example.com',
        passwordHash: 'already-hashed-secret',
        status: undefined,
      });
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe(baseUser.email);
    });

    it('forwards an explicit status', async () => {
      repository.existsByEmail.mockResolvedValue(false);
      repository.create.mockResolvedValue({ ...baseUser, status: UserStatus.INACTIVE });

      await service.createUser({
        email: 'user@example.com',
        passwordHash: 'already-hashed-secret',
        status: UserStatus.INACTIVE,
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: UserStatus.INACTIVE }),
      );
    });

    it('throws a ConflictException when the email already exists', async () => {
      repository.existsByEmail.mockResolvedValue(true);

      await expect(
        service.createUser({ email: 'user@example.com', passwordHash: 'x' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });
});
