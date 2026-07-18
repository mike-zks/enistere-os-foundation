import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { AuthorizationModule } from './auth/authorization/authorization.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { LoggingModule } from './common/logging/logging.module';
import { ThrottlingModule } from './common/throttling/throttling.module';
import { configuration } from './config/configuration';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { FilesModule } from './files/files.module';
import { HealthModule } from './health/health.module';
import { PermissionsGuard } from './permissions/guards/permissions.guard';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesGuard } from './roles/guards/roles.guard';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    LoggingModule,
    DatabaseModule,
    ThrottlingModule,
    AuditModule,
    HealthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    AuthorizationModule,
    AuthModule,
    FilesModule,
  ],
  // Ordre des guards globaux : authentification, puis rôles, puis permissions.
  // Les deux guards d'autorisation sont conditionnels (n'agissent que si @Roles()/@Permissions()).
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
