import { PrismaService } from '../../database/prisma.service';
import { RolesRepository } from './roles.repository';

describe('RolesRepository', () => {
  let roleDelegate: { findUnique: jest.Mock; create: jest.Mock; findMany: jest.Mock };
  let userRoleDelegate: { upsert: jest.Mock; deleteMany: jest.Mock; findUnique: jest.Mock };
  let repository: RolesRepository;

  beforeEach(() => {
    roleDelegate = { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() };
    userRoleDelegate = {
      upsert: jest.fn().mockResolvedValue(undefined),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUnique: jest.fn(),
    };
    repository = new RolesRepository({
      role: roleDelegate,
      userRole: userRoleDelegate,
    } as unknown as PrismaService);
  });

  it('findByCode queries by code', async () => {
    await repository.findByCode('administrator');
    expect(roleDelegate.findUnique).toHaveBeenCalledWith({ where: { code: 'administrator' } });
  });

  it('assignToUser upserts on the composite key', async () => {
    await repository.assignToUser('user-1', 'role-1', 'actor-1');
    const arg = userRoleDelegate.upsert.mock.calls[0][0];
    expect(arg.where).toEqual({ userId_roleId: { userId: 'user-1', roleId: 'role-1' } });
    expect(arg.create).toEqual({ userId: 'user-1', roleId: 'role-1', assignedBy: 'actor-1' });
  });

  it('removeFromUser deletes the association', async () => {
    const count = await repository.removeFromUser('user-1', 'role-1');
    expect(userRoleDelegate.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', roleId: 'role-1' },
    });
    expect(count).toBe(1);
  });

  it('listByUser queries roles of a user sorted by code', async () => {
    roleDelegate.findMany.mockResolvedValue([]);
    await repository.listByUser('user-1');
    const arg = roleDelegate.findMany.mock.calls[0][0];
    expect(arg.where).toEqual({ users: { some: { userId: 'user-1' } } });
    expect(arg.orderBy).toEqual({ code: 'asc' });
  });

  it('userHasRole returns true when the association exists', async () => {
    userRoleDelegate.findUnique.mockResolvedValue({ userId: 'user-1' });
    await expect(repository.userHasRole('user-1', 'role-1')).resolves.toBe(true);
    expect(userRoleDelegate.findUnique).toHaveBeenCalledWith({
      where: { userId_roleId: { userId: 'user-1', roleId: 'role-1' } },
      select: { userId: true },
    });
  });

  it('userHasRole returns false when the association is absent', async () => {
    userRoleDelegate.findUnique.mockResolvedValue(null);
    await expect(repository.userHasRole('user-1', 'role-1')).resolves.toBe(false);
  });
});
