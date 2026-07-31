import { ConflictException, NotFoundException } from '@nestjs/common';
import { FileStatus, StoredFile } from '@prisma/client';

import { AuditService } from '../../../audit/audit.service';
import { FilesRepository } from '../files.repository';
import { ObjectStorage } from '../storage/object-storage';
import { FileQuarantineService } from './file-quarantine.service';

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

describe('FileQuarantineService', () => {
  let repository: {
    findById: jest.Mock;
    quarantineConditional: jest.Mock;
    restoreConditional: jest.Mock;
  };
  let objectStorage: { objectExists: jest.Mock };
  let auditService: { record: jest.Mock };
  let service: FileQuarantineService;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      quarantineConditional: jest.fn().mockResolvedValue(1),
      restoreConditional: jest.fn().mockResolvedValue(1),
    };
    objectStorage = { objectExists: jest.fn().mockResolvedValue(true) };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };

    service = new FileQuarantineService(
      repository as unknown as FilesRepository,
      auditService as unknown as AuditService,
      objectStorage as unknown as ObjectStorage,
    );
  });

  describe('quarantine', () => {
    it('quarantines a VALIDATED file with the given reason', async () => {
      repository.findById.mockResolvedValue(file());

      await service.quarantine('file-1', 'admin-1', 'SECURITY_REVIEW');

      expect(repository.quarantineConditional).toHaveBeenCalledWith('file-1', 'SECURITY_REVIEW');
      const audited = auditService.record.mock.calls[0][0] as {
        eventType: string;
        actorId: string;
        metadata: { reasonCode: string };
      };
      expect(audited.eventType).toBe('FILE_QUARANTINED');
      expect(audited.actorId).toBe('admin-1');
      expect(audited.metadata.reasonCode).toBe('SECURITY_REVIEW');
    });

    it('is idempotent when the file is already quarantined', async () => {
      repository.findById.mockResolvedValue(file({ status: FileStatus.QUARANTINED }));
      await service.quarantine('file-1', 'admin-1', 'MANUAL_ACTION');
      expect(repository.quarantineConditional).not.toHaveBeenCalled();
      expect(auditService.record).not.toHaveBeenCalled();
    });

    it.each([FileStatus.PENDING, FileStatus.REJECTED, FileStatus.DELETED])(
      'refuses to quarantine a %s file (409)',
      async (status) => {
        repository.findById.mockResolvedValue(file({ status }));
        await expect(service.quarantine('file-1', 'admin-1', 'MANUAL_ACTION')).rejects.toBeInstanceOf(
          ConflictException,
        );
        expect(repository.quarantineConditional).not.toHaveBeenCalled();
      },
    );

    it('returns 404 for an unknown file', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.quarantine('file-x', 'admin-1', 'MANUAL_ACTION')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('refuses (409) when a concurrent change won the race', async () => {
      repository.findById.mockResolvedValue(file());
      repository.quarantineConditional.mockResolvedValue(0);
      await expect(service.quarantine('file-1', 'admin-1', 'MANUAL_ACTION')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('restore', () => {
    it('restores a QUARANTINED file with a present object and a checksum', async () => {
      repository.findById.mockResolvedValue(file({ status: FileStatus.QUARANTINED }));

      await service.restore('file-1', 'admin-1');

      expect(repository.restoreConditional).toHaveBeenCalledWith('file-1');
      expect(recordedEventTypes(auditService.record)).toEqual(['FILE_QUARANTINE_RELEASED']);
    });

    it('is idempotent when the file is already validated', async () => {
      repository.findById.mockResolvedValue(file({ status: FileStatus.VALIDATED }));
      await service.restore('file-1', 'admin-1');
      expect(repository.restoreConditional).not.toHaveBeenCalled();
      expect(auditService.record).not.toHaveBeenCalled();
    });

    it('refuses to restore when the object is missing (409 + audit)', async () => {
      repository.findById.mockResolvedValue(file({ status: FileStatus.QUARANTINED }));
      objectStorage.objectExists.mockResolvedValue(false);

      await expect(service.restore('file-1', 'admin-1')).rejects.toBeInstanceOf(ConflictException);
      expect(repository.restoreConditional).not.toHaveBeenCalled();
      expect(recordedEventTypes(auditService.record)).toEqual(['FILE_STORAGE_OBJECT_MISSING']);
    });

    it('refuses to restore when the checksum is unavailable (409)', async () => {
      repository.findById.mockResolvedValue(file({ status: FileStatus.QUARANTINED, checksum: null }));
      await expect(service.restore('file-1', 'admin-1')).rejects.toBeInstanceOf(ConflictException);
      expect(objectStorage.objectExists).not.toHaveBeenCalled();
    });

    it.each([FileStatus.PENDING, FileStatus.REJECTED, FileStatus.DELETED])(
      'refuses to restore a %s file (409)',
      async (status) => {
        repository.findById.mockResolvedValue(file({ status }));
        await expect(service.restore('file-1', 'admin-1')).rejects.toBeInstanceOf(ConflictException);
        expect(repository.restoreConditional).not.toHaveBeenCalled();
      },
    );

    it('returns 404 for an unknown file', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.restore('file-x', 'admin-1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
