import { ConfigService } from '@nestjs/config';
import { FileStatus, StoredFile } from '@prisma/client';

import { AuditService } from '../../audit/audit.service';
import { AppConfig } from '../../config/configuration';
import { FilesRepository } from '../files.repository';
import { ObjectStorage } from '../storage/object-storage';
import { FileReconciliationService } from './file-reconciliation.service';

const CONFIG: Partial<Record<keyof AppConfig, unknown>> = {
  s3Bucket: 'test-bucket',
  nodeEnv: 'test',
  filesPendingExpirationSeconds: 1000,
  filesOrphanMinAgeSeconds: 1000,
  filesReconciliationBatchSize: 100,
};

function file(overrides: Partial<StoredFile> = {}): StoredFile {
  return {
    id: 'file-1',
    ownerId: 'user-1',
    subjectId: null,
    originalName: 'photo.jpg',
    storageKey: 'test/image/2026/06/uuid.jpg',
    bucket: 'test-bucket',
    mimeType: 'image/jpeg',
    extension: 'jpg',
    size: 6n,
    checksum: 'a'.repeat(64),
    visibility: 'PRIVATE',
    status: FileStatus.VALIDATED,
    category: 'IMAGE',
    metadata: null,
    uploadedAt: new Date(),
    validatedAt: new Date(),
    rejectedAt: null,
    quarantinedAt: null,
    quarantineReason: null,
    deletionRequestedAt: null,
    storageDeletedAt: null,
    createdAt: new Date('2020-01-01T00:00:00.000Z'),
    updatedAt: new Date('2020-01-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

function recordedEventTypes(record: jest.Mock): string[] {
  return record.mock.calls.map((call) => (call[0] as { eventType: string }).eventType);
}

describe('FileReconciliationService', () => {
  let repository: {
    findActiveByStatus: jest.Mock;
    findExpiredPending: jest.Mock;
    findByStorageKey: jest.Mock;
    markDeletedConditional: jest.Mock;
    rejectConditional: jest.Mock;
  };
  let objectStorage: { objectExists: jest.Mock; deleteObject: jest.Mock; listObjects: jest.Mock };
  let auditService: { record: jest.Mock };
  let service: FileReconciliationService;
  let byStatus: Partial<Record<FileStatus, StoredFile[]>>;

  beforeEach(() => {
    byStatus = {};
    repository = {
      findActiveByStatus: jest.fn((status: FileStatus) => Promise.resolve(byStatus[status] ?? [])),
      findExpiredPending: jest.fn().mockResolvedValue([]),
      findByStorageKey: jest.fn().mockResolvedValue(null),
      markDeletedConditional: jest.fn().mockResolvedValue(1),
      rejectConditional: jest.fn().mockResolvedValue(1),
    };
    objectStorage = {
      objectExists: jest.fn().mockResolvedValue(true),
      deleteObject: jest.fn().mockResolvedValue(undefined),
      listObjects: jest.fn().mockResolvedValue({ objects: [] }),
    };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };
    const configService = { get: jest.fn((key: keyof AppConfig) => CONFIG[key]) };

    service = new FileReconciliationService(
      repository as unknown as FilesRepository,
      auditService as unknown as AuditService,
      objectStorage as unknown as ObjectStorage,
      configService as unknown as ConfigService<AppConfig, true>,
    );
  });

  it('takes no action when a VALIDATED row has its object present', async () => {
    byStatus[FileStatus.VALIDATED] = [file({ id: 'v1' })];
    const report = await service.reconcile({ dryRun: false });
    expect(repository.rejectConditional).not.toHaveBeenCalled();
    expect(repository.markDeletedConditional).not.toHaveBeenCalled();
    expect(report.actions).toEqual([]);
  });

  it('Cas A: VALIDATED + object missing (no deletion requested) → REJECTED', async () => {
    byStatus[FileStatus.VALIDATED] = [file({ id: 'v1' })];
    objectStorage.objectExists.mockResolvedValue(false);

    const report = await service.reconcile({ dryRun: false });

    expect(repository.rejectConditional).toHaveBeenCalledWith('v1', [FileStatus.VALIDATED]);
    expect(report.actions).toContainEqual({
      type: 'validated_object_missing',
      resource: 'v1',
      action: 'mark_rejected',
      applied: true,
    });
    expect(recordedEventTypes(auditService.record)).toContain('FILE_RECONCILIATION_ACTION');
  });

  it('Cas A bis: VALIDATED + object missing + deletion requested → DELETED', async () => {
    byStatus[FileStatus.VALIDATED] = [file({ id: 'v1', deletionRequestedAt: new Date() })];
    objectStorage.objectExists.mockResolvedValue(false);

    await service.reconcile({ dryRun: false });

    expect(repository.markDeletedConditional).toHaveBeenCalledWith('v1');
    expect(repository.rejectConditional).not.toHaveBeenCalled();
  });

  it('Cas B: expired PENDING without object → REJECTED + FILE_PENDING_EXPIRED', async () => {
    repository.findExpiredPending.mockResolvedValue([file({ id: 'p1', status: FileStatus.PENDING })]);
    objectStorage.objectExists.mockResolvedValue(false);

    const report = await service.reconcile({ dryRun: false });

    expect(repository.rejectConditional).toHaveBeenCalledWith('p1', [FileStatus.PENDING]);
    expect(recordedEventTypes(auditService.record)).toContain('FILE_PENDING_EXPIRED');
    expect(report.counts.pending_expired_no_object).toBe(1);
  });

  it('Cas B bis: expired PENDING with object present → report only (never auto-validate)', async () => {
    repository.findExpiredPending.mockResolvedValue([file({ id: 'p1', status: FileStatus.PENDING })]);
    objectStorage.objectExists.mockResolvedValue(true);

    const report = await service.reconcile({ dryRun: false });

    expect(repository.rejectConditional).not.toHaveBeenCalled();
    expect(report.actions).toContainEqual({
      type: 'pending_expired_with_object',
      resource: 'p1',
      action: 'report_only',
      applied: false,
    });
  });

  it('Cas C: REJECTED row with object present → delete object, keep status', async () => {
    byStatus[FileStatus.REJECTED] = [file({ id: 'r1', status: FileStatus.REJECTED })];
    objectStorage.objectExists.mockResolvedValue(true);

    const report = await service.reconcile({ dryRun: false });

    expect(objectStorage.deleteObject).toHaveBeenCalledWith('test-bucket', 'test/image/2026/06/uuid.jpg');
    expect(report.counts.rejected_object_present).toBe(1);
  });

  it('Cas D: DELETED row with object present → delete object', async () => {
    byStatus[FileStatus.DELETED] = [file({ id: 'd1', status: FileStatus.DELETED })];
    objectStorage.objectExists.mockResolvedValue(true);

    const report = await service.reconcile({ dryRun: false });

    expect(objectStorage.deleteObject).toHaveBeenCalled();
    expect(report.counts.deleted_object_present).toBe(1);
  });

  it('Cas E: old orphan object (no DB row) → deleted', async () => {
    objectStorage.listObjects.mockResolvedValue({
      objects: [{ key: 'test/image/orphan.jpg', size: 10, lastModified: new Date('2020-01-01T00:00:00.000Z') }],
    });
    repository.findByStorageKey.mockResolvedValue(null);

    const report = await service.reconcile({ dryRun: false });

    expect(objectStorage.deleteObject).toHaveBeenCalledWith('test-bucket', 'test/image/orphan.jpg');
    expect(recordedEventTypes(auditService.record)).toContain('FILE_ORPHAN_DELETED');
    expect(report.counts.orphan).toBe(1);
  });

  it('Cas E bis: recent orphan object → report only (never deleted)', async () => {
    objectStorage.listObjects.mockResolvedValue({
      objects: [{ key: 'test/image/fresh.jpg', size: 10, lastModified: new Date() }],
    });

    const report = await service.reconcile({ dryRun: false });

    expect(objectStorage.deleteObject).not.toHaveBeenCalled();
    expect(report.counts.orphan_too_recent).toBe(1);
  });

  it('does not delete an object that still has a DB row (not an orphan)', async () => {
    objectStorage.listObjects.mockResolvedValue({
      objects: [{ key: 'test/image/owned.jpg', size: 10, lastModified: new Date('2020-01-01T00:00:00.000Z') }],
    });
    repository.findByStorageKey.mockResolvedValue(file());

    const report = await service.reconcile({ dryRun: false });

    expect(objectStorage.deleteObject).not.toHaveBeenCalled();
    expect(report.actions).toEqual([]);
  });

  it('dry-run proposes actions without mutating anything', async () => {
    byStatus[FileStatus.VALIDATED] = [file({ id: 'v1' })];
    objectStorage.objectExists.mockResolvedValue(false);

    const report = await service.reconcile({ dryRun: true });

    expect(repository.rejectConditional).not.toHaveBeenCalled();
    expect(objectStorage.deleteObject).not.toHaveBeenCalled();
    expect(report.actions).toContainEqual({
      type: 'validated_object_missing',
      resource: 'v1',
      action: 'mark_rejected',
      applied: false,
    });
    // En dry-run, aucune action métier auditée (seulement START/COMPLETED).
    expect(recordedEventTypes(auditService.record)).toEqual([
      'FILE_RECONCILIATION_STARTED',
      'FILE_RECONCILIATION_COMPLETED',
    ]);
  });

  it('paginates the orphan listing across continuation tokens', async () => {
    objectStorage.listObjects
      .mockResolvedValueOnce({
        objects: [{ key: 'test/a.jpg', size: 1, lastModified: new Date('2020-01-01T00:00:00.000Z') }],
        nextContinuationToken: 'tok',
      })
      .mockResolvedValueOnce({
        objects: [{ key: 'test/b.jpg', size: 1, lastModified: new Date('2020-01-01T00:00:00.000Z') }],
      });

    const report = await service.reconcile({ dryRun: false });

    expect(objectStorage.listObjects).toHaveBeenCalledTimes(2);
    expect(report.scannedObjects).toBe(2);
    expect(objectStorage.deleteObject).toHaveBeenCalledTimes(2);
  });

  it('always scopes the listing to the environment prefix', async () => {
    await service.reconcile({ dryRun: true });
    const firstCall = objectStorage.listObjects.mock.calls[0][0] as { prefix: string; bucket: string };
    expect(firstCall.prefix).toBe('test/');
    expect(firstCall.bucket).toBe('test-bucket');
  });

  it('bounds DB queries by the resolved batch limit', async () => {
    await service.reconcile({ dryRun: true, maxItems: 1 });
    expect(repository.findActiveByStatus).toHaveBeenCalledWith(FileStatus.VALIDATED, 1);
  });

  it('takes no destructive action when storage existence is uncertain (error)', async () => {
    byStatus[FileStatus.VALIDATED] = [file({ id: 'v1' })];
    objectStorage.objectExists.mockRejectedValue(new Error('Object storage head failed.'));

    const report = await service.reconcile({ dryRun: false });

    expect(repository.rejectConditional).not.toHaveBeenCalled();
    expect(report.actions).toEqual([]);
  });

  it('cleanupExpiredPending only processes PENDING rows', async () => {
    repository.findExpiredPending.mockResolvedValue([file({ id: 'p1', status: FileStatus.PENDING })]);
    objectStorage.objectExists.mockResolvedValue(false);

    const report = await service.cleanupExpiredPending({ dryRun: false });

    expect(repository.findActiveByStatus).not.toHaveBeenCalled();
    expect(objectStorage.listObjects).not.toHaveBeenCalled();
    expect(repository.rejectConditional).toHaveBeenCalledWith('p1', [FileStatus.PENDING]);
    expect(report.counts.pending_expired_no_object).toBe(1);
  });
});
