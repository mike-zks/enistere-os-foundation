import {
  BadRequestException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FileCategory, FileStatus, FileVisibility, StoredFile } from '@prisma/client';

import { AuditService } from '../../../audit/audit.service';
import { StoredFileView } from '../contracts/stored-file-view';
import { FilesRepository } from '../files.repository';
import { FilesService } from '../files.service';
import { ObjectStorage } from '../storage/object-storage';
import { FileValidationPolicy } from '../validation/file-validation-policy';
import { ContentTypeDetector } from './content-type-detector';
import { FileUploadService } from './file-upload.service';

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

const pendingView: StoredFileView = {
  id: 'file-1',
  ownerId: 'user-1',
  subjectId: null,
  originalName: 'photo.jpg',
  storageKey: 'test/image/2026/06/uuid.jpg',
  bucket: 'test-bucket',
  mimeType: 'image/jpeg',
  extension: 'jpg',
  size: '6',
  checksum: null,
  visibility: FileVisibility.PRIVATE,
  status: FileStatus.PENDING,
  category: FileCategory.IMAGE,
  createdAt: new Date('2026-06-01T00:00:00.000Z'),
  updatedAt: new Date('2026-06-01T00:00:00.000Z'),
};

function validatedFile(): StoredFile {
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
    checksum: 'hash',
    visibility: FileVisibility.PRIVATE,
    status: FileStatus.VALIDATED,
    category: FileCategory.IMAGE,
    metadata: null,
    uploadedAt: new Date(),
    validatedAt: new Date(),
    rejectedAt: null,
    quarantinedAt: null,
    quarantineReason: null,
    deletionRequestedAt: null,
    storageDeletedAt: null,
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    updatedAt: new Date('2026-06-01T00:00:00.000Z'),
    deletedAt: null,
  };
}

function recordedEvents(mock: jest.Mock): string[] {
  return mock.mock.calls.map((call) => (call[0] as { eventType: string }).eventType);
}

describe('FileUploadService', () => {
  let filesService: { createPendingFile: jest.Mock };
  let filesRepository: { finalize: jest.Mock; reject: jest.Mock };
  let detector: { detect: jest.Mock };
  let checksumService: { sha256Hex: jest.Mock };
  let validationPolicy: { normalizeOriginalName: jest.Mock; assertSizeWithinLimit: jest.Mock };
  let auditService: { record: jest.Mock };
  let objectStorage: { putObject: jest.Mock; deleteObject: jest.Mock };
  let service: FileUploadService;

  const dto = { category: FileCategory.IMAGE };

  beforeEach(() => {
    filesService = { createPendingFile: jest.fn().mockResolvedValue(pendingView) };
    filesRepository = {
      finalize: jest.fn().mockResolvedValue(validatedFile()),
      reject: jest.fn().mockResolvedValue(undefined),
    };
    detector = { detect: jest.fn().mockReturnValue({ mimeType: 'image/jpeg', extension: 'jpg' }) };
    checksumService = { sha256Hex: jest.fn(() => 'hash') };
    validationPolicy = {
      normalizeOriginalName: jest.fn((name: string) => name.trim()),
      assertSizeWithinLimit: jest.fn(),
    };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };
    objectStorage = {
      putObject: jest.fn().mockResolvedValue(undefined),
      deleteObject: jest.fn().mockResolvedValue(undefined),
    };

    service = new FileUploadService(
      filesService as unknown as FilesService,
      filesRepository as unknown as FilesRepository,
      detector as unknown as ContentTypeDetector,
      checksumService,
      validationPolicy as unknown as FileValidationPolicy,
      auditService as unknown as AuditService,
      objectStorage as unknown as ObjectStorage,
    );
  });

  it('uploads a valid file: PENDING created with the detected type, object written, finalized VALIDATED', async () => {
    const result = await service.upload('user-1', JPEG, 'photo.jpg', dto);

    expect(filesService.createPendingFile).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ mimeType: 'image/jpeg', extension: 'jpg', size: 6, category: 'IMAGE' }),
    );
    expect(objectStorage.putObject).toHaveBeenCalledWith({
      bucket: 'test-bucket',
      storageKey: 'test/image/2026/06/uuid.jpg',
      body: JPEG,
      contentType: 'image/jpeg',
    });
    expect(filesRepository.finalize).toHaveBeenCalledWith('file-1', { checksum: 'hash', size: 6n });

    expect(result.status).toBe('VALIDATED');
    expect(result.size).toBe('6');
    expect(result).not.toHaveProperty('storageKey');
    expect(recordedEvents(auditService.record)).toContain('FILE_UPLOADED');
  });

  it('rejects undetected content before creating any StoredFile', async () => {
    detector.detect.mockReturnValue(null);

    await expect(service.upload('user-1', Buffer.from('x'), 'a.jpg', dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(filesService.createPendingFile).not.toHaveBeenCalled();
    expect(recordedEvents(auditService.record)).toContain('FILE_UPLOAD_FAILED');
  });

  it('rejects content not matching the declared category', async () => {
    detector.detect.mockReturnValue({ mimeType: 'application/pdf', extension: 'pdf' });

    await expect(service.upload('user-1', JPEG, 'a.pdf', { category: FileCategory.IMAGE })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(filesService.createPendingFile).not.toHaveBeenCalled();
  });

  it('rejects a declared extension incompatible with the real content', async () => {
    await expect(service.upload('user-1', JPEG, 'photo.exe', dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(filesService.createPendingFile).not.toHaveBeenCalled();
  });

  it('marks REJECTED and fails when object storage is unavailable', async () => {
    objectStorage.putObject.mockRejectedValue(new Error('down'));

    await expect(service.upload('user-1', JPEG, 'photo.jpg', dto)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(filesRepository.reject).toHaveBeenCalledWith('file-1');
    expect(recordedEvents(auditService.record)).toContain('FILE_UPLOAD_FAILED');
  });

  it('compensates by deleting the object when finalization fails', async () => {
    filesRepository.finalize.mockRejectedValue(new Error('db down'));

    await expect(service.upload('user-1', JPEG, 'photo.jpg', dto)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    expect(objectStorage.deleteObject).toHaveBeenCalledWith('test-bucket', 'test/image/2026/06/uuid.jpg');
  });

  it('flags an orphaned object when compensation deletion also fails', async () => {
    filesRepository.finalize.mockRejectedValue(new Error('db down'));
    objectStorage.deleteObject.mockRejectedValue(new Error('storage down'));

    await expect(service.upload('user-1', JPEG, 'photo.jpg', dto)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    expect(recordedEvents(auditService.record)).toContain('FILE_ORPHANED_OBJECT_DETECTED');
  });
});
