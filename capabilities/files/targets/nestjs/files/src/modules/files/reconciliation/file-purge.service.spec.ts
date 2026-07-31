import { ConfigService } from '@nestjs/config';
import { FileStatus, StoredFile } from '@prisma/client';

import { AuditService } from '../../../audit/audit.service';
import { FilesConfig } from '../files.configuration';
import { FilesRepository } from '../files.repository';
import { ObjectStorage } from '../storage/object-storage';
import { FilePurgeService } from './file-purge.service';

const CONFIG: Partial<Record<keyof FilesConfig, unknown>> = {
  filesRejectedRetentionSeconds: 1000,
  filesDeletedMetadataRetentionSeconds: 1000,
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
    checksum: null,
    visibility: 'PRIVATE',
    status: FileStatus.DELETED,
    category: 'IMAGE',
    metadata: null,
    uploadedAt: null,
    validatedAt: null,
    rejectedAt: null,
    quarantinedAt: null,
    quarantineReason: null,
    deletionRequestedAt: null,
    storageDeletedAt: new Date('2020-01-01T00:00:00.000Z'),
    createdAt: new Date('2020-01-01T00:00:00.000Z'),
    updatedAt: new Date('2020-01-01T00:00:00.000Z'),
    deletedAt: new Date('2020-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('FilePurgeService', () => {
  let repository: {
    findPurgeableDeleted: jest.Mock;
    findPurgeableRejected: jest.Mock;
    hardDeletePurgeable: jest.Mock;
  };
  let objectStorage: { objectExists: jest.Mock };
  let auditService: { record: jest.Mock };
  let service: FilePurgeService;

  beforeEach(() => {
    repository = {
      findPurgeableDeleted: jest.fn().mockResolvedValue([]),
      findPurgeableRejected: jest.fn().mockResolvedValue([]),
      hardDeletePurgeable: jest.fn().mockResolvedValue(1),
    };
    objectStorage = { objectExists: jest.fn().mockResolvedValue(false) };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };
    const configService = { get: jest.fn((key: keyof FilesConfig) => CONFIG[key]) };

    service = new FilePurgeService(
      repository as unknown as FilesRepository,
      auditService as unknown as AuditService,
      objectStorage as unknown as ObjectStorage,
      configService as unknown as ConfigService<FilesConfig, true>,
    );
  });

  it('purges an old DELETED row whose object is absent (apply)', async () => {
    repository.findPurgeableDeleted.mockResolvedValue([file({ id: 'd1', status: FileStatus.DELETED })]);

    const report = await service.purgeMetadata({ dryRun: false });

    expect(repository.hardDeletePurgeable).toHaveBeenCalledWith('d1', FileStatus.DELETED);
    expect(report.counts.purge_deleted).toBe(1);
  });

  it('purges an old REJECTED row whose object is absent (apply)', async () => {
    repository.findPurgeableRejected.mockResolvedValue([file({ id: 'r1', status: FileStatus.REJECTED })]);

    const report = await service.purgeMetadata({ dryRun: false });

    expect(repository.hardDeletePurgeable).toHaveBeenCalledWith('r1', FileStatus.REJECTED);
    expect(report.counts.purge_rejected).toBe(1);
  });

  it('does NOT purge a row whose object is still present (signals instead)', async () => {
    repository.findPurgeableDeleted.mockResolvedValue([file({ id: 'd1', status: FileStatus.DELETED })]);
    objectStorage.objectExists.mockResolvedValue(true);

    const report = await service.purgeMetadata({ dryRun: false });

    expect(repository.hardDeletePurgeable).not.toHaveBeenCalled();
    expect(report.counts.purge_deleted_object_present).toBe(1);
  });

  it('does NOT purge when storage existence is uncertain (error → keep row)', async () => {
    repository.findPurgeableDeleted.mockResolvedValue([file({ id: 'd1', status: FileStatus.DELETED })]);
    objectStorage.objectExists.mockRejectedValue(new Error('head failed'));

    const report = await service.purgeMetadata({ dryRun: false });

    expect(repository.hardDeletePurgeable).not.toHaveBeenCalled();
    expect(report.counts.purge_deleted_object_present).toBe(1);
  });

  it('dry-run proposes purges without deleting', async () => {
    repository.findPurgeableDeleted.mockResolvedValue([file({ id: 'd1', status: FileStatus.DELETED })]);

    const report = await service.purgeMetadata({ dryRun: true });

    expect(repository.hardDeletePurgeable).not.toHaveBeenCalled();
    expect(report.actions).toContainEqual({
      type: 'purge_deleted',
      resource: 'd1',
      action: 'purge_row',
      applied: false,
    });
  });
});
