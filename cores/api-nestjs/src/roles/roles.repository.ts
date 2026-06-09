import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';

/** Accès Prisma aux rôles et aux associations utilisateur ↔ rôle. */
@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Role | null> {
    return this.prisma.role.findUnique({ where: { id } });
  }

  findByCode(code: string): Promise<Role | null> {
    return this.prisma.role.findUnique({ where: { code } });
  }

  create(data: Prisma.RoleCreateInput): Promise<Role> {
    return this.prisma.role.create({ data });
  }

  /** Affectation idempotente d'un rôle à un utilisateur. */
  async assignToUser(userId: string, roleId: string, assignedBy?: string | null): Promise<void> {
    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      create: { userId, roleId, assignedBy: assignedBy ?? null },
      update: {},
    });
  }

  async removeFromUser(userId: string, roleId: string): Promise<number> {
    const result = await this.prisma.userRole.deleteMany({ where: { userId, roleId } });
    return result.count;
  }

  /** Rôles d'un utilisateur, triés par code. */
  listByUser(userId: string): Promise<Role[]> {
    return this.prisma.role.findMany({
      where: { users: { some: { userId } } },
      orderBy: { code: 'asc' },
    });
  }

  async userHasRole(userId: string, roleId: string): Promise<boolean> {
    const found = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
      select: { userId: true },
    });
    return found !== null;
  }
}
