import { ConflictException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileCategory, FileStatus, FileVisibility } from '@prisma/client';

import { AuditService } from '../../audit/audit.service';
import { AppConfig } from '../../config/configuration';
import { StoredFileView } from '../contracts/stored-file-view';
import { FilesService } from '../files.service';
import { ObjectStorage } from '../storage/object-storage';
import { FileAccessService } from './file-access.service';

const TTL = 300;

function view(overrides: Partial<StoredFileView> = {}): StoredFileView {
  return {
    id: 'file-1',
    ownerId: 'user-1',
    subjectId: null,
    originalName: 'café photo.jpg',
    storageKey: 'test/IMAGE/2026/06/uuid.jpg',
    bucket: 'private-bucket',
    mimeType: 'image/jpeg',
    extension: 'jpg',
    size: '6',
    checksum: 'a'.repeat(64),
    visibility: FileVisibility.PRIVATE,
    status: FileStatus.VALIDATED,
    category: FileCategory.IMAGE,
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    updatedAt: new Date('2026-06-01T00:00:00.000Z'),
    ...overrides,
  };
}

function recordedEventTypes(record: jest.Mock): string[] {
  return record.mock.calls.map((call) => (call[0] as { eventType: string }).eventType);
}

describe('FileAccessService', () => {
  let filesService: { getOwnedFile: jest.Mock; findOwnedFile: jest.Mock };
  let auditService: { record: jest.Mock };
  let objectStorage: { objectExists: jest.Mock; createSignedReadUrl: jest.Mock };
  let service: FileAccessService;

  beforeEach(() => {
    filesService = { getOwnedFile: jest.fn(), findOwnedFile: jest.fn() };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };
    objectStorage = {
      objectExists: jest.fn().mockResolvedValue(true),
      createSignedReadUrl: jest
        .fn()
        .mockResolvedValue({ url: 'https://minio.local/b/k?X-Amz-Signature=sig', expiresAt: new Date() }),
    };
    const configService = { get: jest.fn().mockReturnValue(TTL) };

    service = new FileAccessService(
      filesService as unknown as FilesService,
      auditService as unknown as AuditService,
      objectStorage as unknown as ObjectStorage,
      configService as unknown as ConfigService<AppConfig, true>,
    );
  });

  describe('getMetadata', () => {
    it('returns the owned public file (no audit for a banal read)', async () => {
      const publicFile = { id: 'file-1', status: 'VALIDATED' };
      filesService.getOwnedFile.mockResolvedValue(publicFile);

      await expect(service.getMetadata('file-1', 'user-1')).resolves.toBe(publicFile);
      expect(filesService.getOwnedFile).toHaveBeenCalledWith('file-1', 'user-1');
      expect(auditService.record).not.toHaveBeenCalled();
    });

    it('propagates the 404 (anti-enumeration) for an absent/unowned file', async () => {
      filesService.getOwnedFile.mockRejectedValue(new NotFoundException());
      await expect(service.getMetadata('file-x', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('issueDownloadUrl', () => {
    it('signs a short URL for a VALIDATED private file and audits the issuance (without the URL)', async () => {
      filesService.findOwnedFile.mockResolvedValue(view());

      const result = await service.issueDownloadUrl('file-1', 'user-1');

      expect(result).toEqual({ url: 'https://minio.local/b/k?X-Amz-Signature=sig', expiresAt: expect.any(Date) });
      expect(Object.keys(result).sort()).toEqual(['expiresAt', 'url']);

      const signArg = objectStorage.createSignedReadUrl.mock.calls[0][0] as {
        bucket: string;
        storageKey: string;
        expiresInSeconds: number;
        responseContentType: string;
        responseContentDisposition: string;
      };
      expect(signArg.bucket).toBe('private-bucket');
      expect(signArg.storageKey).toBe('test/IMAGE/2026/06/uuid.jpg');
      expect(signArg.expiresInSeconds).toBe(TTL);
      expect(signArg.responseContentType).toBe('image/jpeg');
      expect(signArg.responseContentDisposition.startsWith('attachment;')).toBe(true);

      expect(recordedEventTypes(auditService.record)).toEqual(['FILE_DOWNLOAD_URL_ISSUED']);
      const audited = auditService.record.mock.calls[0][0] as {
        metadata: Record<string, unknown>;
      };
      expect(audited.metadata.expiresInSeconds).toBe(TTL);
      expect(JSON.stringify(audited)).not.toContain('X-Amz-Signature');
      expect(JSON.stringify(audited)).not.toContain('storageKey');
      expect(JSON.stringify(audited)).not.toContain('private-bucket');
    });

    it.each([FileStatus.PENDING, FileStatus.REJECTED, FileStatus.QUARANTINED, FileStatus.UPLOADED])(
      'refuses a %s file with 409 FILE_NOT_DOWNLOADABLE (no signing, denial audited)',
      async (status) => {
        filesService.findOwnedFile.mockResolvedValue(view({ status }));

        await expect(service.issueDownloadUrl('file-1', 'user-1')).rejects.toBeInstanceOf(ConflictException);
        expect(objectStorage.objectExists).not.toHaveBeenCalled();
        expect(objectStorage.createSignedReadUrl).not.toHaveBeenCalled();
        expect(recordedEventTypes(auditService.record)).toEqual(['FILE_DOWNLOAD_URL_DENIED']);
      },
    );

    it.each([FileVisibility.PUBLIC, FileVisibility.INTERNAL])(
      'refuses a VALIDATED file with non-signable visibility %s (409)',
      async (visibility) => {
        filesService.findOwnedFile.mockResolvedValue(view({ visibility }));

        await expect(service.issueDownloadUrl('file-1', 'user-1')).rejects.toBeInstanceOf(ConflictException);
        expect(objectStorage.createSignedReadUrl).not.toHaveBeenCalled();
      },
    );

    it('signs a VALIDATED file with SIGNED visibility', async () => {
      filesService.findOwnedFile.mockResolvedValue(view({ visibility: FileVisibility.SIGNED }));
      await expect(service.issueDownloadUrl('file-1', 'user-1')).resolves.toHaveProperty('url');
    });

    it('propagates the 404 for an absent/unowned/soft-deleted file', async () => {
      filesService.findOwnedFile.mockRejectedValue(new NotFoundException());
      await expect(service.issueDownloadUrl('file-x', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns a generic 503 and audits a missing object without signing', async () => {
      filesService.findOwnedFile.mockResolvedValue(view());
      objectStorage.objectExists.mockResolvedValue(false);

      await expect(service.issueDownloadUrl('file-1', 'user-1')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      expect(objectStorage.createSignedReadUrl).not.toHaveBeenCalled();
      expect(recordedEventTypes(auditService.record)).toEqual(['FILE_STORAGE_OBJECT_MISSING']);
    });

    it('treats a storage error during existence check as a missing object (generic 503)', async () => {
      filesService.findOwnedFile.mockResolvedValue(view());
      objectStorage.objectExists.mockRejectedValue(new Error('Object storage head failed.'));

      await expect(service.issueDownloadUrl('file-1', 'user-1')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      expect(recordedEventTypes(auditService.record)).toEqual(['FILE_STORAGE_OBJECT_MISSING']);
    });

    it('returns a generic 503 when signing fails (no detail leaked)', async () => {
      filesService.findOwnedFile.mockResolvedValue(view());
      objectStorage.createSignedReadUrl.mockRejectedValue(new Error('Object storage signing failed.'));

      await expect(service.issueDownloadUrl('file-1', 'user-1')).rejects.toMatchObject({
        response: { code: 'FILE_SIGNED_URL_GENERATION_FAILED' },
      });
      expect(recordedEventTypes(auditService.record)).toEqual(['FILE_DOWNLOAD_URL_DENIED']);
    });
  });
});
