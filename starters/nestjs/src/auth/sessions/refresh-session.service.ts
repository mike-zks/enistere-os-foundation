import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, RefreshSession, SessionRevocationReason, UserStatus } from '@prisma/client';

import { AppConfig } from '../../config/configuration';
import { PrismaService } from '../../database/prisma.service';
import { RefreshTokenService } from '../tokens/refresh-token.service';
import { RefreshSessionRepository } from './refresh-session.repository';

/** Métadonnées techniques facultatives et encadrées (jamais un facteur d'auth). */
export interface RefreshSessionMetadata {
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface CreatedRefreshSession {
  sessionId: string;
  /** Token opaque complet, remis au client uniquement (jamais persisté). */
  refreshToken: string;
  familyId: string;
  expiresAt: Date;
  expiresInSeconds: number;
}

/** Levée lorsque l'ancienne session a déjà été révoquée par un refresh concurrent. */
export class RefreshRotationConflictError extends Error {
  constructor() {
    super('Refresh rotation conflict');
    this.name = 'RefreshRotationConflictError';
  }
}

const USER_AGENT_MAX_LENGTH = 255;
const IP_ADDRESS_MAX_LENGTH = 45;

function normalizeMetadata(value: string | null | undefined, maxLength: number): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : null;
}

/**
 * Cycle de vie des `RefreshSession` : création (login), rotation atomique (refresh)
 * et révocation de famille. Ne stocke que l'empreinte du secret, jamais le token brut.
 */
@Injectable()
export class RefreshSessionService {
  private readonly refreshTtlSeconds: number;

  constructor(
    private readonly repository: RefreshSessionRepository,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly prisma: PrismaService,
    configService: ConfigService<AppConfig, true>,
  ) {
    this.refreshTtlSeconds = configService.get('refreshTokenTtl', { infer: true });
  }

  findById(sessionId: string): Promise<RefreshSession | null> {
    return this.repository.findById(sessionId);
  }

  /**
   * Valide qu'une session peut servir une requête authentifiée (Auth 4) :
   * existe, appartient à `userId`, non révoquée, non expirée, utilisateur ACTIVE.
   * Une seule requête (jointure utilisateur). N'expose aucune donnée sensible.
   */
  async validateAccessSession(sessionId: string, userId: string): Promise<boolean> {
    const session = await this.repository.findByIdWithUser(sessionId);

    if (!session || session.userId !== userId || session.revokedAt) {
      return false;
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      return false;
    }

    return session.user.status === UserStatus.ACTIVE;
  }

  /** Connexion : nouvelle famille de tokens. */
  createForUser(
    userId: string,
    metadata: RefreshSessionMetadata = {},
  ): Promise<CreatedRefreshSession> {
    return this.persist(this.prisma, userId, randomUUID(), metadata);
  }

  /**
   * Rotation atomique : crée la nouvelle session (même `familyId`) puis révoque
   * conditionnellement l'ancienne. Si l'ancienne n'est plus active (refresh
   * concurrent), la transaction est annulée et `RefreshRotationConflictError` est levée
   * — aucune nouvelle session ne subsiste.
   */
  rotate(
    previous: RefreshSession,
    metadata: RefreshSessionMetadata = {},
  ): Promise<CreatedRefreshSession> {
    return this.prisma.$transaction(async (tx) => {
      const created = await this.persist(tx, previous.userId, previous.familyId, metadata);
      const revokedCount = await this.repository.revokeIfActive(
        previous.id,
        SessionRevocationReason.ROTATED,
        { replacedBySessionId: created.sessionId },
        tx,
      );

      if (revokedCount !== 1) {
        throw new RefreshRotationConflictError();
      }

      return created;
    });
  }

  revokeFamily(familyId: string, reason: SessionRevocationReason): Promise<number> {
    return this.repository.revokeFamily(familyId, reason);
  }

  private async persist(
    client: Prisma.TransactionClient,
    userId: string,
    familyId: string,
    metadata: RefreshSessionMetadata,
  ): Promise<CreatedRefreshSession> {
    const secret = this.refreshTokenService.generateSecret();
    const tokenHash = this.refreshTokenService.fingerprint(secret);
    const expiresAt = new Date(Date.now() + this.refreshTtlSeconds * 1000);

    const session = await this.repository.create(
      {
        user: { connect: { id: userId } },
        tokenHash,
        familyId,
        expiresAt,
        userAgent: normalizeMetadata(metadata.userAgent, USER_AGENT_MAX_LENGTH),
        ipAddress: normalizeMetadata(metadata.ipAddress, IP_ADDRESS_MAX_LENGTH),
      },
      client,
    );

    return {
      sessionId: session.id,
      refreshToken: this.refreshTokenService.buildToken(session.id, secret),
      familyId,
      expiresAt: session.expiresAt,
      expiresInSeconds: this.refreshTtlSeconds,
    };
  }
}
