import { ConflictException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { RolesRepository } from './roles.repository';
import { RolesService } from './roles.service';

function buildRole(overrides: Partial<Role> = {}): Role {
  return {
    id: 'role-1',
    code: 'administrator',
    name: 'Administrator',
    description: null,
    isSystem: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('RolesService', () => {
  let repository: {
    findById: jest.Mock;
    findByCode: jest.Mock;
    create: jest.Mock;
    assignToUser: jest.Mock;
    removeFromUser: jest.Mock;
    listByUser: jest.Mock;
    userHasRole: jest.Mock;
  };
  let auditService: { record: jest.Mock };
  let service: RolesService;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      create: jest.fn(),
      assignToUser: jest.fn().mockResolvedValue(undefined),
      removeFromUser: jest.fn().mockResolvedValue(1),
      listByUser: jest.fn(),
      userHasRole: jest.fn(),
    };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };
    service = new RolesService(
      repository as unknown as RolesRepository,
      auditService as unknown as AuditService,
    );
  });

  describe('createRole', () => {
    it('normalizes the code and creates the role', async () => {
      repository.findByCode.mockResolvedValue(null);
      repository.create.mockResolvedValue(buildRole());

      const result = await service.createRole({ code: '  Administrator ', name: 'Administrator' });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'administrator', name: 'Administrator' }),
      );
      expect(result.code).toBe('administrator');
      expect(result).not.toHaveProperty('createdAt');
    });

    it('rejects a duplicate code', async () => {
      repository.findByCode.mockResolvedValue(buildRole());

      await expect(
        service.createRole({ code: 'administrator', name: 'Administrator' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('assignRoleToUser / removeRoleFromUser', () => {
    it('assigns an existing role and audits it', async () => {
      repository.findByCode.mockResolvedValue(buildRole());

      await service.assignRoleToUser('user-1', 'administrator', 'actor-1');

      expect(repository.assignToUser).toHaveBeenCalledWith('user-1', 'role-1', 'actor-1');
      expect(auditService.record.mock.calls[0][0].eventType).toBe('ROLE_ASSIGNED');
    });

    it('rejects assigning an unknown role', async () => {
      repository.findByCode.mockResolvedValue(null);

      await expect(service.assignRoleToUser('user-1', 'ghost')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('removes a role and audits it', async () => {
      repository.findByCode.mockResolvedValue(buildRole());

      await service.removeRoleFromUser('user-1', 'administrator');

      expect(repository.removeFromUser).toHaveBeenCalledWith('user-1', 'role-1');
      expect(auditService.record.mock.calls[0][0].eventType).toBe('ROLE_REMOVED');
    });
  });

  describe('queries', () => {
    it('getUserRoleCodes returns role codes', async () => {
      repository.listByUser.mockResolvedValue([buildRole(), buildRole({ code: 'user' })]);

      await expect(service.getUserRoleCodes('user-1')).resolves.toEqual(['administrator', 'user']);
    });

    it('userHasRole returns false for an unknown role code', async () => {
      repository.findByCode.mockResolvedValue(null);

      await expect(service.userHasRole('user-1', 'ghost')).resolves.toBe(false);
      expect(repository.userHasRole).not.toHaveBeenCalled();
    });

    it('userHasRole delegates to the repository for an existing role', async () => {
      repository.findByCode.mockResolvedValue(buildRole());
      repository.userHasRole.mockResolvedValue(true);

      await expect(service.userHasRole('user-1', 'administrator')).resolves.toBe(true);
      expect(repository.userHasRole).toHaveBeenCalledWith('user-1', 'role-1');
    });
  });
});
