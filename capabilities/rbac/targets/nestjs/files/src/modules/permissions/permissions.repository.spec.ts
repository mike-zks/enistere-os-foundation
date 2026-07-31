import { PrismaService } from '../../database/prisma.service';
import { PermissionsRepository } from './permissions.repository';

describe('PermissionsRepository', () => {
  let permissionDelegate: { findUnique: jest.Mock; create: jest.Mock; findMany: jest.Mock };
  let rolePermissionDelegate: { upsert: jest.Mock; deleteMany: jest.Mock };
  let repository: PermissionsRepository;

  beforeEach(() => {
    permissionDelegate = { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() };
    rolePermissionDelegate = {
      upsert: jest.fn().mockResolvedValue(undefined),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    };
    repository = new PermissionsRepository({
      permission: permissionDelegate,
      rolePermission: rolePermissionDelegate,
    } as unknown as PrismaService);
  });

  it('findByCode queries by code', async () => {
    await repository.findByCode('users.read');
    expect(permissionDelegate.findUnique).toHaveBeenCalledWith({ where: { code: 'users.read' } });
  });

  it('assignToRole upserts on the composite key', async () => {
    await repository.assignToRole('role-1', 'perm-1', 'actor-1');
    const arg = rolePermissionDelegate.upsert.mock.calls[0][0];
    expect(arg.where).toEqual({ roleId_permissionId: { roleId: 'role-1', permissionId: 'perm-1' } });
    expect(arg.create).toEqual({ roleId: 'role-1', permissionId: 'perm-1', assignedBy: 'actor-1' });
  });

  it('removeFromRole deletes the association', async () => {
    const count = await repository.removeFromRole('role-1', 'perm-1');
    expect(rolePermissionDelegate.deleteMany).toHaveBeenCalledWith({
      where: { roleId: 'role-1', permissionId: 'perm-1' },
    });
    expect(count).toBe(1);
  });

  it('listByRole queries permissions of a role sorted by code', async () => {
    permissionDelegate.findMany.mockResolvedValue([]);
    await repository.listByRole('role-1');
    const arg = permissionDelegate.findMany.mock.calls[0][0];
    expect(arg.where).toEqual({ roles: { some: { roleId: 'role-1' } } });
    expect(arg.orderBy).toEqual({ code: 'asc' });
  });

  it('effectivePermissionCodes returns sorted codes for a user', async () => {
    permissionDelegate.findMany.mockResolvedValue([{ code: 'audit.read' }, { code: 'users.read' }]);
    const codes = await repository.effectivePermissionCodes('user-1');
    expect(codes).toEqual(['audit.read', 'users.read']);
    const arg = permissionDelegate.findMany.mock.calls[0][0];
    expect(arg.where).toEqual({ roles: { some: { role: { users: { some: { userId: 'user-1' } } } } } });
    expect(arg.select).toEqual({ code: true });
  });
});
