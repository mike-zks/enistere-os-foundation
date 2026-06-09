import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileCategory, FileStatus, FileVisibility, StoredFile } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { AppConfig } from '../config/configuration';
import { FilesRepository } from './files.repository';
import { FilesService } from './files.service';
import { FileQuotaService } from './quota/file-quota.service';
import { StorageKeyGenerator } from './storage/storage-key-generator';
import { FileValidationPolicy } from './validation/file-validation-policy';

function buildFile(overrides: Partial<StoredFile> = {}): StoredFile {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    ownerId: 'user-1',
    subjectId: null,
    originalName: 'photo.png',
    storageKey: 'test/image/2026/06/uuid.png',
    bucket: 'test-bucket',
    mimeType: 'image/png',
    extension: 'png',
    size: 1024n,
    checksum: null,
    visibility: FileVisibility.PRIVATE,
    status: FileStatus.PENDING,
    category: FileCategory.IMAGE,
    metadata: null,
    uploadedAt: null,
    validatedAt: null,
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

function recordedEvents(mock: jest.Mock): string[] {
  return mock.mock.calls.map((call) => (call[0] as { eventType: string }).eventType);
}

describe('FilesService', () => {
  let repository: {
    create: jest.Mock;
    createPendingWithinOwnerQuota: jest.Mock;
    findById: jest.Mock;
    findByIdAndOwner: jest.Mock;
    existsByStorageKey: jest.Mock;
    reject: jest.Mock;
    markDeleted: jest.Mock;
  };
  let storageKeyGenerator: { generate: jest.Mock };
  let validationPolicy: {
    normalizeOriginalName: jest.Mock;
    assertMimeAndExtension: jest.Mock;
    assertSizeWithinLimit: jest.Mock;
  };
  let auditService: { record: jest.Mock };
  let quotaService: { getLimits: jest.Mock; rejectQuotaOutcome: jest.Mock };
  let service: FilesService;

  const validInput = {
    originalName: '  photo.png ',
    mimeType: 'IMAGE/PNG',
    extension: '.PNG',
    size: 1024,
    category: FileCategory.IMAGE,
  };

  beforeEach(() => {
    repository = {
      create: jest.fn().mockResolvedValue(buildFile()),
      createPendingWithinOwnerQuota: jest.fn().mockResolvedValue({ outcome: 'created', file: buildFile() }),
      findById: jest.fn(),
      findByIdAndOwner: jest.fn(),
      existsByStorageKey: jest.fn().mockResolvedValue(false),
      reject: jest.fn().mockResolvedValue(buildFile({ status: FileStatus.REJECTED })),
      markDeleted: jest.fn().mockResolvedValue(buildFile({ status: FileStatus.DELETED })),
    };
    storageKeyGenerator = { generate: jest.fn(() => 'test/image/2026/06/uuid.png') };
    validationPolicy = {
      normalizeOriginalName: jest.fn((name: string) => name.trim()),
      assertMimeAndExtension: jest.fn(),
      assertSizeWithinLimit: jest.fn(),
    };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };
    quotaService = {
      getLimits: jest.fn().mockReturnValue({ maxActiveFiles: 0, maxTotalBytes: 0n }),
      rejectQuotaOutcome: jest.fn().mockRejectedValue(new ConflictException({ code: 'FILE_STORAGE_QUOTA_EXCEEDED' })),
    };
    const configService = { get: () => 'test-bucket' } as unknown as ConfigService<AppConfig, true>;

    service = new FilesService(
      repository as unknown as FilesRepository,
      storageKeyGenerator as unknown as StorageKeyGenerator,
      validationPolicy as unknown as FileValidationPolicy,
      auditService as unknown as AuditService,
      quotaService as unknown as FileQuotaService,
      configService,
    );
  });

  describe('createPendingFile', () => {
    it('validates, generates a server-side key and creates a PENDING private file (atomic quota path)', async () => {
      const view = await service.createPendingFile('user-1', validInput);

      expect(validationPolicy.normalizeOriginalName).toHaveBeenCalled();
      expect(validationPolicy.assertMimeAndExtension).toHaveBeenCalledWith('IMAGE', 'image/png', 'png');
      expect(validationPolicy.assertSizeWithinLimit).toHaveBeenCalledWith(1024n);
      expect(storageKeyGenerator.generate).toHaveBeenCalledWith('IMAGE', 'png');

      // Création possédée → passe par la transaction atomique sous quota (pas par create()).
      expect(repository.create).not.toHaveBeenCalled();
      const params = repository.createPendingWithinOwnerQuota.mock.calls[0][0];
      expect(params.ownerId).toBe('user-1');
      expect(params.newSize).toBe(1024n);
      expect(params.data.status).toBe(FileStatus.PENDING);
      expect(params.data.visibility).toBe(FileVisibility.PRIVATE);
      expect(params.data.bucket).toBe('test-bucket');
      expect(params.data.owner).toEqual({ connect: { id: 'user-1' } });
      expect(typeof params.data.size).toBe('bigint');

      expect(view.size).toBe('1024');
      expect(view.storageKey).toBe('test/image/2026/06/uuid.png');
      expect(recordedEvents(auditService.record)).toContain('FILE_PENDING_CREATED');
    });

    it('throws on a storage key conflict (owned path)', async () => {
      repository.createPendingWithinOwnerQuota.mockResolvedValue({ outcome: 'key_conflict' });

      await expect(service.createPendingFile('user-1', validInput)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('delegates a count-quota rejection to the quota service', async () => {
      repository.createPendingWithinOwnerQuota.mockResolvedValue({ outcome: 'count_exceeded' });

      await expect(service.createPendingFile('user-1', validInput)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(quotaService.rejectQuotaOutcome).toHaveBeenCalledWith('count_exceeded', 'user-1', 1024n);
    });

    it('delegates a storage-quota rejection to the quota service', async () => {
      repository.createPendingWithinOwnerQuota.mockResolvedValue({ outcome: 'size_exceeded' });

      await expect(service.createPendingFile('user-1', validInput)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(quotaService.rejectQuotaOutcome).toHaveBeenCalledWith('size_exceeded', 'user-1', 1024n);
    });

    it('uses the unowned path (no quota) when ownerId is null', async () => {
      await service.createPendingFile(null, validInput);
      expect(repository.create).toHaveBeenCalled();
      expect(repository.createPendingWithinOwnerQuota).not.toHaveBeenCalled();
    });
  });

  describe('getOwnedFile', () => {
    it('returns the public contract without storage internals', async () => {
      repository.findByIdAndOwner.mockResolvedValue(buildFile());

      const result = await service.getOwnedFile('file-1', 'user-1');

      expect(result.id).toBe('11111111-1111-1111-1111-111111111111');
      expect(result.size).toBe('1024');
      expect(result).not.toHaveProperty('storageKey');
      expect(result).not.toHaveProperty('bucket');
      expect(result).not.toHaveProperty('ownerId');
    });

    it('returns 404 for an absent or non-owned file (anti-enumeration)', async () => {
      repository.findByIdAndOwner.mockResolvedValue(null);

      await expect(service.getOwnedFile('file-1', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('markFileDeleted', () => {
    it('soft-deletes an owned file and audits it', async () => {
      repository.findByIdAndOwner.mockResolvedValue(buildFile());

      await service.markFileDeleted('file-1', 'user-1');

      expect(repository.markDeleted).toHaveBeenCalledWith('file-1');
      const events = recordedEvents(auditService.record);
      expect(events).toContain('FILE_MARKED_DELETED');
    });

    it('does not delete a non-owned file', async () => {
      repository.findByIdAndOwner.mockResolvedValue(null);

      await expect(service.markFileDeleted('file-1', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.markDeleted).not.toHaveBeenCalled();
    });
  });

  describe('rejectFile', () => {
    it('rejects an existing file and audits it', async () => {
      repository.findById.mockResolvedValue(buildFile());

      await service.rejectFile('file-1', 'bad_metadata');

      expect(repository.reject).toHaveBeenCalledWith('file-1');
      const events = recordedEvents(auditService.record);
      expect(events).toContain('FILE_REJECTED');
    });
  });
});
