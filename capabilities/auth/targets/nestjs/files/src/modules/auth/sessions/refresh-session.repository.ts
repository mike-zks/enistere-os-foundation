import { Injectable } from '@nestjs/common';
import { Prisma, RefreshSession, SessionRevocationReason } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';

// Client Prisma standard ou client de transaction (pour les opérations atomiques).
type PrismaClientLike = Prisma.TransactionClient;

/** Session avec son utilisateur, pour la validation d'accès en une seule requête. */
export type RefreshSessionWithUser = Prisma.RefreshSessionGetPayload<{ include: { user: true } }>;

/**
 * Encapsule les accès Prisma à `RefreshSession`.
 *
 * Les opérations critiques acceptent un client de transaction optionnel afin de
 * participer à une rotation atomique (cf. RefreshSessionService.rotate).
 */
@Injectable()
export class RefreshSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    data: Prisma.RefreshSessionCreateInput,
    client: PrismaClientLike = this.prisma,
  ): Promise<RefreshSession> {
    return client.refreshSession.create({ data });
  }

  findById(id: string, client: PrismaClientLike = this.prisma): Promise<RefreshSession | null> {
    return client.refreshSession.findUnique({ where: { id } });
  }

  /** Charge la session et son utilisateur en une seule requête (validation d'accès Auth 4). */
  findByIdWithUser(id: string): Promise<RefreshSessionWithUser | null> {
    return this.prisma.refreshSession.findUnique({ where: { id }, include: { user: true } });
  }

  /**
   * Révocation conditionnelle : ne révoque que si la session est encore active
   * (`revokedAt IS NULL`). Sous READ COMMITTED, deux révocations concurrentes de
   * la même ligne se sérialisent ; une seule renvoie `count === 1`. Retourne le
   * nombre de lignes affectées.
   */
  async revokeIfActive(
    id: string,
    reason: SessionRevocationReason,
    options: { replacedBySessionId?: string } = {},
    client: PrismaClientLike = this.prisma,
  ): Promise<number> {
    const now = new Date();
    const result = await client.refreshSession.updateMany({
      where: { id, revokedAt: null },
      data: {
        revokedAt: now,
        revocationReason: reason,
        lastUsedAt: now,
        replacedBySessionId: options.replacedBySessionId ?? null,
      },
    });

    return result.count;
  }

  /** Révoque toutes les sessions actives d'une famille. Retourne le nombre révoqué. */
  async revokeFamily(
    familyId: string,
    reason: SessionRevocationReason,
    client: PrismaClientLike = this.prisma,
  ): Promise<number> {
    const result = await client.refreshSession.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date(), revocationReason: reason },
    });

    return result.count;
  }

  /** Révoque toutes les sessions actives d'un utilisateur (préparation logout global futur). */
  async revokeActiveByUser(
    userId: string,
    reason: SessionRevocationReason,
    client: PrismaClientLike = this.prisma,
  ): Promise<number> {
    const result = await client.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revocationReason: reason },
    });

    return result.count;
  }
}
