import { Module } from '@nestjs/common';

import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

/**
 * Module utilisateur interne minimal.
 *
 * Expose uniquement `UsersService` (boundary applicatif). `UsersRepository`
 * reste interne au module. `PrismaService` est fourni globalement par
 * `DatabaseModule`.
 */
@Module({
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
