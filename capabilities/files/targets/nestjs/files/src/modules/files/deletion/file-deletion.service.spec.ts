import {
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FileStatus, StoredFile } from '@prisma/client';

import { AuditService } from '../../../audit/audit.service';
import { FilesRepository } from '../files.repository';
import { ObjectStorage } from '../storage/object-storage';
import { FileDeletionService } from './file-deletion.service';

function file(overrides: Partial<StoredFile> = {}): StoredFile {
  return {
    id: 'file-1',
    ownerId: 'user-1',
    subjectId: null,
    originalName: 'photo.jpg',
    storageKey: 'test/image/2026/06/uuid.jpg',
    bucket: 'private-bucket',
    mimeType: 'image/jpeg',
    extension: 'jpg',
    size: 6n,
    checksum: 'a'.repeat(64),
    visibility: 'PRIVATE',
    status: FileStatus.VALIDATED,
    category: 'IMAGE',
    metadata: null,
    uploadedAt: new Date('2026-06-01T00:00:00.000Z'),
    validatedAt: new Date('2026-06-01T00:00:00.000Z'),
    rejectedAt: null,
    quarantinedAt: null,
    quarantineReason: null,
    deletionRequestedAt: null,
    storageDeletedAt: null,
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    updatedAt: new Date('2026-06-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

function recordedEventTypes(record: jest.Mock): string[] {
  return record.mock.calls.map((call) => (call[0] as { eventType: string }).eventType);
}

describe('FileDeletionService', () => {
  let repository: {
    findByIdAndOwnerIncludingDeleted: jest.Mock;
    markDeletionRequested: jest.Mock;
    markDeletedConditional: jest.Mock;
  };
  let objectStorage: { objectExists: jest.Mock; deleteObject: jest.Mock };
  let auditService: { record: jest.Mock };
  let service: FileDeletionService;

  beforeEach(() => {
    repository = {
      findByIdAndOwnerIncludingDeleted: jest.fn(),
      markDeletionRequested: jest.fn().mockResolvedValue(undefined),
      markDeletedConditional: jest.fn().mockResolvedValue(1),
    };
    objectStorage = {
      objectExists: jest.fn().mockResolvedValue(true),
      deleteObject: jest.fn().mockResolvedValue(undefined),
    };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };

    service = new FileDeletionService(
      repository as unknown as FilesRepository,
      auditService as unknown as AuditService,
      objectStorage as unknown as ObjectStorage,
    );
  });

  it('deletes object then marks DELETED (object present) and audits', async () => {
    repository.findByIdAndOwnerIncludingDeleted.mockResolvedValue(file());

    await service.delete('file-1', 'user-1');

    expect(objectStorage.deleteObject).toHaveBeenCalledWith('private-bucket', 'test/image/2026/06/uuid.jpg');
    expect(repository.markDeletionRequested).toHaveBeenCalledWith('file-1');
    expect(repository.markDeletedConditional).toHaveBeenCalledWith('file-1');
    expect(recordedEventTypes(auditService.record)).toEqual([
      'FILE_DELETION_REQUESTED',
      'FILE_OBJECT_DELETED',
      'FILE_DELETED',
    ]);
    // Aucune donnée interne en audit.
    const serialized = JSON.stringify(auditService.record.mock.calls);
    expect(serialized).not.toContain('storageKey');
    expect(serialized).not.toContain('private-bucket');
    expect(serialized).not.toContain('a'.repeat(64));
  });

  it('treats an already-missing object as success and audits the inconsistency', async () => {
    repository.findByIdAndOwnerIncludingDeleted.mockResolvedValue(file());
    objectStorage.objectExists.mockResolvedValue(false);

    await service.delete('file-1', 'user-1');

    expect(objectStorage.deleteObject).toHaveBeenCalled();
    expect(repository.markDeletedConditional).toHaveBeenCalled();
    expect(recordedEventTypes(auditService.record)).toEqual([
      'FILE_DELETION_REQUESTED',
      'FILE_STORAGE_OBJECT_MISSING',
      'FILE_DELETED',
    ]);
  });

  it('is idempotent for an already-deleted file (no object call, no audit)', async () => {
    repository.findByIdAndOwnerIncludingDeleted.mockResolvedValue(file({ status: FileStatus.DELETED }));

    await service.delete('file-1', 'user-1');

    expect(objectStorage.deleteObject).not.toHaveBeenCalled();
    expect(repository.markDeletedConditional).not.toHaveBeenCalled();
    expect(auditService.record).not.toHaveBeenCalled();
  });

  it('returns 404 for an absent or unowned file', async () => {
    repository.findByIdAndOwnerIncludingDeleted.mockResolvedValue(null);
    await expect(service.delete('file-x', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(objectStorage.deleteObject).not.toHaveBeenCalled();
  });

  it('does not mark DELETED when object deletion fails (503)', async () => {
    repository.findByIdAndOwnerIncludingDeleted.mockResolvedValue(file());
    objectStorage.deleteObject.mockRejectedValue(new Error('Object storage delete failed.'));

    await expect(service.delete('file-1', 'user-1')).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(repository.markDeletedConditional).not.toHaveBeenCalled();
    expect(recordedEventTypes(auditService.record)).toEqual(['FILE_DELETION_REQUESTED', 'FILE_DELETION_FAILED']);
  });

  it('raises a critical audit when DB finalization fails after object deletion (500)', async () => {
    repository.findByIdAndOwnerIncludingDeleted.mockResolvedValue(file());
    repository.markDeletedConditional.mockRejectedValue(new Error('db down'));

    await expect(service.delete('file-1', 'user-1')).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(objectStorage.deleteObject).toHaveBeenCalled();
    expect(recordedEventTypes(auditService.record)).toEqual([
      'FILE_DELETION_REQUESTED',
      'FILE_OBJECT_DELETED',
      'FILE_DATABASE_FINALIZATION_FAILED',
      'FILE_STORAGE_OBJECT_MISSING',
    ]);
  });

  it.each([FileStatus.VALIDATED, FileStatus.QUARANTINED, FileStatus.REJECTED, FileStatus.PENDING])(
    'deletes a %s file',
    async (status) => {
      repository.findByIdAndOwnerIncludingDeleted.mockResolvedValue(file({ status }));
      await service.delete('file-1', 'user-1');
      expect(repository.markDeletedConditional).toHaveBeenCalledWith('file-1');
    },
  );
});
