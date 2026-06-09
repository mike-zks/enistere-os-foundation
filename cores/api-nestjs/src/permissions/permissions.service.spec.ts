import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Permission } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { PermissionsRepository } from './permissions.repository';
import { PermissionsService } from './permissions.service';

function buildPermission(overrides: Partial<Permission> = {}): Permission {
  return {
    id: 'perm-1',
    code: 'users.read',
    resource: 'users',
    action: 'read',
    description: null,
    isSystem: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('PermissionsService', () => {
  let repository: {
    findByCode: jest.Mock;
    create: jest.Mock;
    assignToRole: jest.Mock;
    removeFromRole: jest.Mock;
    listByRole: jest.Mock;
    effectivePermissionCodes: jest.Mock;
  };
  let auditService: { record: jest.Mock };
  let service: PermissionsService;

  beforeEach(() => {
    repository = {
      findByCode: jest.fn(),
      create: jest.fn(),
      assignToRole: jest.fn().mockResolvedValue(undefined),
      removeFromRole: jest.fn().mockResolvedValue(1),
      listByRole: jest.fn(),
      effectivePermissionCodes: jest.fn(),
    };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };
    service = new PermissionsService(
      repository as unknown as PermissionsRepository,
      auditService as unknown as AuditService,
    );
  });

  describe('createPermission', () => {
    it('creates a permission deriving resource and action from the code', async () => {
      repository.findByCode.mockResolvedValue(null);
      repository.create.mockResolvedValue(buildPermission());

      const result = await service.createPermission({ code: 'users.read' });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'users.read', resource: 'users', action: 'read' }),
      );
      expect(result.code).toBe('users.read');
      expect(result).not.toHaveProperty('createdAt');
    });

    it.each(['Users.Read', 'users read', 'users', 'users.*'])(
      'rejects the invalid code %s',
      async (code) => {
        await expect(service.createPermission({ code })).rejects.toBeInstanceOf(BadRequestException);
      },
    );

    it('rejects a duplicate code', async () => {
      repository.findByCode.mockResolvedValue(buildPermission());

      await expect(service.createPermission({ code: 'users.read' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('assignToRole / removeFromRole', () => {
    it('assigns an existing permission and audits it', async () => {
      repository.findByCode.mockResolvedValue(buildPermission());

      await service.assignToRole('role-1', 'users.read', 'actor-1');

      expect(repository.assignToRole).toHaveBeenCalledWith('role-1', 'perm-1', 'actor-1');
      expect(auditService.record.mock.calls[0][0].eventType).toBe('PERMISSION_ASSIGNED_TO_ROLE');
    });

    it('rejects assignment of an unknown permission', async () => {
      repository.findByCode.mockResolvedValue(null);

      await expect(service.assignToRole('role-1', 'users.read')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('removes a permission from a role and audits it', async () => {
      repository.findByCode.mockResolvedValue(buildPermission());

      await service.removeFromRole('role-1', 'users.read');

      expect(repository.removeFromRole).toHaveBeenCalledWith('role-1', 'perm-1');
      expect(auditService.record.mock.calls[0][0].eventType).toBe('PERMISSION_REMOVED_FROM_ROLE');
    });
  });

  describe('effective permissions', () => {
    it('returns the repository union (sorted/deduplicated upstream)', async () => {
      repository.effectivePermissionCodes.mockResolvedValue(['audit.read', 'users.read']);

      await expect(service.getEffectivePermissions('user-1')).resolves.toEqual([
        'audit.read',
        'users.read',
      ]);
    });

    it('hasPermissions requires all requested permissions (AND)', async () => {
      repository.effectivePermissionCodes.mockResolvedValue(['users.read', 'audit.read']);

      await expect(service.hasPermissions('user-1', ['users.read', 'audit.read'])).resolves.toBe(true);
      await expect(service.hasPermissions('user-1', ['users.read', 'roles.manage'])).resolves.toBe(false);
    });

    it('hasPermissions returns true when nothing is required', async () => {
      await expect(service.hasPermissions('user-1', [])).resolves.toBe(true);
      expect(repository.effectivePermissionCodes).not.toHaveBeenCalled();
    });
  });
});
