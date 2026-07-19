import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UsersModule } from '../users/users.module';
import { authConfig } from './auth.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Argon2PasswordHasher } from './password/argon2-password-hasher';
import { PASSWORD_HASHER } from './password/password-hasher';
import { RefreshSessionRepository } from './sessions/refresh-session.repository';
import { RefreshSessionService } from './sessions/refresh-session.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { AccessTokenService } from './tokens/access-token.service';
import { RefreshTokenService } from './tokens/refresh-token.service';

/**
 * AuthModule — login (Auth 2), refresh/rotation/logout (Auth 3), sessions.
 *
 * Capability autonome : sa configuration namespace (`auth.config.ts`) valide son
 * propre environnement, sans dépendre de la configuration de la baseline.
 * Hachage Argon2id centralisé derrière `PASSWORD_HASHER` (ADR-039). Rate limiting
 * via deux throttlers nommés (`login`, `refresh`) déclarés par l'overlay et
 * enregistrés par le fichier de composition généré ; chaque route sélectionne le
 * sien avec `@SkipThrottle`. L'audit est fourni globalement par `AuditModule`
 * (baseline). Aucune dépendance vers RBAC : l'autorisation est une capability
 * distincte qui se compose au-dessus d'Auth.
 */
@Module({
  imports: [
    ConfigModule.forFeature(authConfig),
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(authConfig)],
      inject: [authConfig.KEY],
      useFactory: (config: ConfigType<typeof authConfig>) => ({
        secret: config.jwtAccessSecret,
        signOptions: { expiresIn: config.jwtAccessTtl },
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
