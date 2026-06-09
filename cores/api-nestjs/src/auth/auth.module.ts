import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AppConfig } from '../config/configuration';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthorizationModule } from './authorization/authorization.module';
import { Argon2PasswordHasher } from './password/argon2-password-hasher';
import { PASSWORD_HASHER } from './password/password-hasher';
import { RefreshSessionRepository } from './sessions/refresh-session.repository';
import { RefreshSessionService } from './sessions/refresh-session.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { AccessTokenService } from './tokens/access-token.service';
import { RefreshTokenService } from './tokens/refresh-token.service';

/**
 * AuthModule — login (Auth 2), refresh/rotation/logout (Auth 3).
 *
 * Hachage Argon2id centralisé derrière `PASSWORD_HASHER` (ADR-039). Rate limiting
 * via deux throttlers nommés (`login`, `refresh`), chaque route sélectionnant le
 * sien avec `@SkipThrottle`. L'audit est fourni globalement par `AuditModule`.
 */
@Module({
  imports: [
    UsersModule,
    PassportModule,
    AuthorizationModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        secret: config.get('jwtAccessSecret', { infer: true }),
        signOptions: { expiresIn: config.get('jwtAccessTtl', { infer: true }) },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessTokenService,
    RefreshTokenService,
    RefreshSessionRepository,
    RefreshSessionService,
    JwtAccessStrategy,
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
  ],
})
export class AuthModule {}
