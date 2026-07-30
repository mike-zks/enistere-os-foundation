import { Injectable } from '@nestjs/common';
import { Permission, Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

/** Accès Prisma aux permissions et aux associations rôle ↔ permission. */
@Injectable()
export class PermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByCode(code: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({ where: { code } });
  }

  create(data: Prisma.PermissionCreateInput): Promise<Permission> {
    return this.prisma.permission.create({ data });
  }

  /** Affectation idempotente d'une permission à un rôle. */
  async assignToRole(roleId: string, permissionId: string, assignedBy?: string | null): Promise<void> {
    await this.prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      create: { roleId, permissionId, assignedBy: assignedBy ?? null },
      update: {},
    });
  }

  async removeFromRole(roleId: string, permissionId: string): Promise<number> {
    const result = await this.prisma.rolePermission.deleteMany({ where: { roleId, permissionId } });
    return result.count;
  }

  /** Permissions d'un rôle, triées par code. */
  listByRole(roleId: string): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      where: { roles: { some: { roleId } } },
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Codes de permissions effectives d'un utilisateur (union de ses rôles), triés.
   * Une permission portée par plusieurs rôles n'apparaît qu'une fois (ligne unique).
   */
  async effectivePermissionCodes(userId: string): Promise<string[]> {
    const rows = await this.prisma.permission.findMany({
      where: { roles: { some: { role: { users: { some: { userId } } } } } },
      select: { code: true },
      orderBy: { code: 'asc' },
    });

    return rows.map((row) => row.code);
  }
}
