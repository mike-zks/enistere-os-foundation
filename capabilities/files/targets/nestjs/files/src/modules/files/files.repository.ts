import { Injectable } from '@nestjs/common';
import { FileStatus, Prisma, StoredFile } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

/** Statuts comptant dans l'usage ACTIF d'un propriétaire (REJECTED/DELETED exclus). */
const ACTIVE_STATUSES: FileStatus[] = [
  FileStatus.PENDING,
  FileStatus.UPLOADED,
  FileStatus.VALIDATED,
  FileStatus.QUARANTINED,
];

export interface OwnerQuotaCreateParams {
  ownerId: string;
  storageKey: string;
  newSize: bigint;
  maxActiveFiles: number; // 0 = illimité
  maxTotalBytes: bigint; // 0n = illimité
  data: Prisma.StoredFileCreateInput;
}

export type OwnerQuotaCreateOutcome =
  | { outcome: 'created'; file: StoredFile }
  | { outcome: 'count_exceeded' }
  | { outcome: 'size_exceeded' }
  | { outcome: 'key_conflict' };

/** Accès Prisma à `StoredFile`. Aucune logique métier ; pas de recherche complexe en V1. */
@Injectable()
export class FilesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.StoredFileCreateInput): Promise<StoredFile> {
    return this.prisma.storedFile.create({ data });
  }

  /**
   * Création `PENDING` **atomique sous quota** (Upload 5). Dans UNE transaction interactive :
   * verrou advisory **par propriétaire** (`pg_advisory_xact_lock`, auto-relâché en fin de
   * transaction) → vérification d'unicité de clé → calcul de l'usage actif → contrôle des quotas
   * → insertion. Le verrou sérialise les uploads concurrents d'un même propriétaire : la
   * vérification et l'insertion sont indissociables (pas de dépassement par course). Aucun appel
   * réseau (S3) dans la transaction.
   */
  createPendingWithinOwnerQuota(params: OwnerQuotaCreateParams): Promise<OwnerQuotaCreateOutcome> {
    return this.prisma.$transaction(async (tx) => {
      // `$executeRaw` (et non `$queryRaw`) : `pg_advisory_xact_lock` renvoie `void`, non
      // désérialisable en colonne par Prisma. Verrou bloquant transactionnel par propriétaire.
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${`files-quota:${params.ownerId}`})::bigint)`,
      );

      const existing = await tx.storedFile.findUnique({
        where: { storageKey: params.storageKey },
        select: { id: true },
      });
      if (existing) {
        return { outcome: 'key_conflict' };
      }

      if (params.maxActiveFiles > 0) {
        const count = await tx.storedFile.count({
          where: { ownerId: params.ownerId, deletedAt: null, status: { in: ACTIVE_STATUSES } },
        });
        if (count + 1 > params.maxActiveFiles) {
          return { outcome: 'count_exceeded' };
        }
      }

      if (params.maxTotalBytes > 0n) {
        const aggregate = await tx.storedFile.aggregate({
          _sum: { size: true },
          where: { ownerId: params.ownerId, deletedAt: null, status: { in: ACTIVE_STATUSES } },
        });
        const projected = (aggregate._sum.size ?? 0n) + params.newSize;
        if (projected > params.maxTotalBytes) {
          return { outcome: 'size_exceeded' };
        }
      }

      const file = await tx.storedFile.create({ data: params.data });
      return { outcome: 'created', file };
    });
  }

  findById(id: string): Promise<StoredFile | null> {
    return this.prisma.storedFile.findUnique({ where: { id } });
  }

  /** Fichier non supprimé appartenant au propriétaire (ownership). */
  findByIdAndOwner(id: string, ownerId: string): Promise<StoredFile | null> {
    return this.prisma.storedFile.findFirst({ where: { id, ownerId, deletedAt: null } });
  }

  /**
   * Fichier appartenant au propriétaire, **y compris supprimé** (pour une suppression
   * idempotente : un fichier déjà `DELETED` doit renvoyer un succès, pas un 404).
   */
  findByIdAndOwnerIncludingDeleted(id: string, ownerId: string): Promise<StoredFile | null> {
    return this.prisma.storedFile.findFirst({ where: { id, ownerId } });
  }

  async existsByStorageKey(storageKey: string): Promise<boolean> {
    const found = await this.prisma.storedFile.findUnique({
      where: { storageKey },
      select: { id: true },
    });
    return found !== null;
  }

  /** Finalisation après stockage effectif (Upload 2) : VALIDATED + horodatages. */
  finalize(
    id: string,
    data: { checksum?: string | null; size?: bigint; metadata?: Prisma.InputJsonValue },
  ): Promise<StoredFile> {
    const now = new Date();
    return this.prisma.storedFile.update({
      where: { id },
      data: {
        status: FileStatus.VALIDATED,
        uploadedAt: now,
        validatedAt: now,
        checksum: data.checksum ?? undefined,
        size: data.size,
        metadata: data.metadata,
      },
    });
  }

  reject(id: string): Promise<StoredFile> {
    return this.prisma.storedFile.update({
      where: { id },
      data: { status: FileStatus.REJECTED, rejectedAt: new Date() },
    });
  }

  markDeleted(id: string): Promise<StoredFile> {
    return this.prisma.storedFile.update({
      where: { id },
      data: { status: FileStatus.DELETED, deletedAt: new Date() },
    });
  }

  listByOwner(ownerId: string, skip: number, take: number): Promise<StoredFile[]> {
    return this.prisma.storedFile.findMany({
      where: { ownerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  // --- Upload 4 : transitions conditionnelles (anti-concurrence) ---

  /** Marque l'intention de suppression AVANT la suppression de l'objet (ordre objet→DB). */
  markDeletionRequested(id: string): Promise<StoredFile> {
    return this.prisma.storedFile.update({
      where: { id },
      data: { deletionRequestedAt: new Date() },
    });
  }

  /**
   * Marque `DELETED` de façon CONDITIONNELLE (seulement si pas déjà supprimé) : deux suppressions
   * concurrentes ne produisent qu'une transition. Renvoie le nombre de lignes affectées.
   */
  async markDeletedConditional(id: string): Promise<number> {
    const now = new Date();
    const { count } = await this.prisma.storedFile.updateMany({
      where: { id, status: { not: FileStatus.DELETED } },
      data: { status: FileStatus.DELETED, deletedAt: now, storageDeletedAt: now },
    });
    return count;
  }

  /** Met en quarantaine de façon conditionnelle (seulement depuis `VALIDATED`). */
  async quarantineConditional(id: string, reasonCode: string): Promise<number> {
    const { count } = await this.prisma.storedFile.updateMany({
      where: { id, status: FileStatus.VALIDATED },
      data: { status: FileStatus.QUARANTINED, quarantinedAt: new Date(), quarantineReason: reasonCode },
    });
    return count;
  }

  /** Lève la quarantaine de façon conditionnelle (seulement depuis `QUARANTINED`). */
  async restoreConditional(id: string): Promise<number> {
    const { count } = await this.prisma.storedFile.updateMany({
      where: { id, status: FileStatus.QUARANTINED },
      data: { status: FileStatus.VALIDATED, quarantinedAt: null, quarantineReason: null },
    });
    return count;
  }

  /** Rejette de façon conditionnelle (réconciliation) ; ne touche que les statuts attendus. */
  async rejectConditional(id: string, fromStatuses: FileStatus[]): Promise<number> {
    const { count } = await this.prisma.storedFile.updateMany({
      where: { id, status: { in: fromStatuses } },
      data: { status: FileStatus.REJECTED, rejectedAt: new Date() },
    });
    return count;
  }

  // --- Upload 4 : requêtes de réconciliation (bornées par `take`) ---

  findActiveByStatus(status: FileStatus, take: number): Promise<StoredFile[]> {
    return this.prisma.storedFile.findMany({
      where: { status },
      orderBy: { createdAt: 'asc' },
      take,
    });
  }

  findExpiredPending(olderThan: Date, take: number): Promise<StoredFile[]> {
    return this.prisma.storedFile.findMany({
      where: { status: FileStatus.PENDING, createdAt: { lt: olderThan } },
      orderBy: { createdAt: 'asc' },
      take,
    });
  }

  findByStorageKey(storageKey: string): Promise<StoredFile | null> {
    return this.prisma.storedFile.findUnique({ where: { storageKey } });
  }

  // --- Upload 5 : purge physique des métadonnées (rétention dépassée) ---

  findPurgeableDeleted(olderThan: Date, take: number): Promise<StoredFile[]> {
    return this.prisma.storedFile.findMany({
      where: { status: FileStatus.DELETED, deletedAt: { lt: olderThan } },
      orderBy: { deletedAt: 'asc' },
      take,
    });
  }

  findPurgeableRejected(olderThan: Date, take: number): Promise<StoredFile[]> {
    return this.prisma.storedFile.findMany({
      where: { status: FileStatus.REJECTED, rejectedAt: { lt: olderThan } },
      orderBy: { rejectedAt: 'asc' },
      take,
    });
  }

  /** Suppression PHYSIQUE conditionnelle d'une ligne (jamais l'AuditLog associé). */
  async hardDeletePurgeable(id: string, status: FileStatus): Promise<number> {
    const { count } = await this.prisma.storedFile.deleteMany({ where: { id, status } });
    return count;
  }

  // --- Upload 4 : fondations de quota (lecture seule, pas d'application stricte en V1) ---

  countActiveByOwner(ownerId: string): Promise<number> {
    return this.prisma.storedFile.count({
      where: {
        ownerId,
        deletedAt: null,
        status: { in: [FileStatus.PENDING, FileStatus.UPLOADED, FileStatus.VALIDATED, FileStatus.QUARANTINED] },
      },
    });
  }

  async sumActiveSizeByOwner(ownerId: string): Promise<bigint> {
    const result = await this.prisma.storedFile.aggregate({
      _sum: { size: true },
      where: {
        ownerId,
        deletedAt: null,
        status: { in: [FileStatus.PENDING, FileStatus.UPLOADED, FileStatus.VALIDATED, FileStatus.QUARANTINED] },
      },
    });
    return result._sum.size ?? 0n;
  }
}
