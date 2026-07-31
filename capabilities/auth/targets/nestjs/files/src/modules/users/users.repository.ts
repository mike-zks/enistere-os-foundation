import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

/**
 * Encapsule les accès Prisma liés à l'entité User.
 *
 * Rôle : organiser l'accès aux données et éviter que PrismaService soit
 * manipulé directement par le reste de l'application (le boundary public est
 * UsersService). Conformément à ADR-002, ce n'est PAS une abstraction ORM
 * interchangeable : le type Prisma `User` est assumé en interne.
 */
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const found = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return found !== null;
  }
}
