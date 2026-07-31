import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FileCategory, FileStatus } from '@prisma/client';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/database/prisma.service';
import { FilesRepository } from '../src/modules/files/files.repository';
import { FilesService } from '../src/modules/files/files.service';

const EMAIL = 'files-e2e@example.test';
const SUBJECT = 'files-e2e-fixture';

describe('Files foundation (e2e integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let filesService: FilesService;
  let filesRepository: FilesRepository;
  let userId: string;

  function input(overrides: Record<string, unknown> = {}) {
    return {
      originalName: 'photo.png',
      mimeType: 'image/png',
      extension: 'png',
      size: 1024,
      category: FileCategory.IMAGE,
      subjectId: SUBJECT,
      ...overrides,
    };
  }

  async function cleanup(): Promise<void> {
    await prisma.storedFile.deleteMany({ where: { subjectId: SUBJECT } });
    await prisma.user.deleteMany({ where: { email: EMAIL } });
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    filesService = app.get(FilesService);
    filesRepository = app.get(FilesRepository, { strict: false });

    await cleanup();
    const user = await prisma.user.create({ data: { email: EMAIL, passwordHash: 'x' } });
    userId = user.id;
  }, 30000);

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  it('creates a PENDING file owned by the user, with a server-side key and BigInt size', async () => {
    const view = await filesService.createPendingFile(userId, input());

    const row = await prisma.storedFile.findUnique({ where: { id: view.id } });
    expect(row?.ownerId).toBe(userId);
    expect(row?.status).toBe(FileStatus.PENDING);
    expect(row?.visibility).toBe('PRIVATE');
    expect(typeof row?.size).toBe('bigint');
    expect(row?.size).toBe(1024n);
    expect(row?.storageKey).not.toContain('photo');
  });

  it('enforces the unique storage key constraint', async () => {
    const base = {
      originalName: 'x',
      bucket: 'b',
      mimeType: 'image/png',
      extension: 'png',
      size: 1n,
      subjectId: SUBJECT,
      storageKey: `dup-${userId}`,
      owner: { connect: { id: userId } },
    };
    await prisma.storedFile.create({ data: base });
    await expect(prisma.storedFile.create({ data: base })).rejects.toBeDefined();
  });

  it('finalizes a file to VALIDATED', async () => {
    const view = await filesService.createPendingFile(userId, input());
    const finalized = await filesRepository.finalize(view.id, { checksum: 'abc123', size: 2048n });

    expect(finalized.status).toBe(FileStatus.VALIDATED);
    expect(finalized.validatedAt).not.toBeNull();
    expect(finalized.uploadedAt).not.toBeNull();
    expect(finalized.size).toBe(2048n);
  });

  it('rejects a file', async () => {
    const view = await filesService.createPendingFile(userId, input());
    const rejected = await filesService.rejectFile(view.id, 'bad_metadata');
    expect(rejected.status).toBe(FileStatus.REJECTED);
  });

  it('soft-deletes an owned file and hides it from owner lookups', async () => {
    const view = await filesService.createPendingFile(userId, input());

    await filesService.markFileDeleted(view.id, userId);

    const row = await prisma.storedFile.findUnique({ where: { id: view.id } });
    expect(row?.status).toBe(FileStatus.DELETED);
    expect(row?.deletedAt).not.toBeNull();

    await expect(filesService.getOwnedFile(view.id, userId)).rejects.toBeDefined();
  });

  it('does not expose a non-owned file (404)', async () => {
    const view = await filesService.createPendingFile(userId, input());
    await expect(
      filesService.getOwnedFile(view.id, '00000000-0000-0000-0000-000000000000'),
    ).rejects.toBeDefined();
  });
});
