import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FileCategory } from '@prisma/client';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/database/prisma.service';
import { FilesService } from '../src/files/files.service';
import { FilesRepository } from '../src/files/files.repository';

const EMAIL_A = 'files-list-a@example.test';
const EMAIL_B = 'files-list-b@example.test';
const SUBJECT = 'files-list-e2e';

function uploadInput(overrides: Record<string, unknown> = {}) {
  return {
    originalName: 'item.png',
    mimeType: 'image/png',
    extension: 'png',
    size: 512,
    category: FileCategory.IMAGE,
    subjectId: SUBJECT,
    ...overrides,
  };
}

describe('Files listing (e2e integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let filesService: FilesService;
  let filesRepository: FilesRepository;
  let userAId: string;
  let userBId: string;

  async function cleanup(): Promise<void> {
    await prisma.storedFile.deleteMany({ where: { subjectId: SUBJECT } });
    await prisma.user.deleteMany({ where: { email: { in: [EMAIL_A, EMAIL_B] } } });
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
    const userA = await prisma.user.create({ data: { email: EMAIL_A, passwordHash: 'x' } });
    const userB = await prisma.user.create({ data: { email: EMAIL_B, passwordHash: 'x' } });
    userAId = userA.id;
    userBId = userB.id;
  }, 30000);

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  it('returns an empty list when the user has no files', async () => {
    const result = await filesService.listOwnedFiles(userAId, 20, 0);

    expect(result.items).toHaveLength(0);
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
    expect(result.nextOffset).toBeNull();
  });

  it('returns only files owned by the requesting user (ownership isolation)', async () => {
    // A crée un fichier, B en crée un autre
    await filesService.createPendingFile(userAId, uploadInput({ originalName: 'a.png' }));
    await filesService.createPendingFile(userBId, uploadInput({ originalName: 'b.png' }));

    const resultA = await filesService.listOwnedFiles(userAId, 20, 0);
    const resultB = await filesService.listOwnedFiles(userBId, 20, 0);

    expect(resultA.items.every((f) => f.id !== undefined)).toBe(true);
    expect(resultB.items.every((f) => f.id !== undefined)).toBe(true);

    // Aucun fichier de B dans les résultats de A
    const idsA = resultA.items.map((f) => f.id);
    const idsB = resultB.items.map((f) => f.id);
    expect(idsA.some((id) => idsB.includes(id))).toBe(false);
  });

  it('excludes DELETED files from the list', async () => {
    const view = await filesService.createPendingFile(userAId, uploadInput());
    await filesService.markFileDeleted(view.id, userAId);

    const result = await filesService.listOwnedFiles(userAId, 20, 0);

    expect(result.items.find((f) => f.id === view.id)).toBeUndefined();
  });

  it('returns files in stable createdAt desc order', async () => {
    // Crée 3 fichiers en séquence
    const first = await filesService.createPendingFile(userAId, uploadInput({ originalName: 'first.png' }));
    // Petite pause pour garantir un createdAt différent
    await new Promise((r) => setTimeout(r, 10));
    const second = await filesService.createPendingFile(userAId, uploadInput({ originalName: 'second.png' }));
    await new Promise((r) => setTimeout(r, 10));
    const third = await filesService.createPendingFile(userAId, uploadInput({ originalName: 'third.png' }));

    const result = await filesService.listOwnedFiles(userAId, 20, 0);

    // Le plus récent en premier
    const ids = result.items.map((f) => f.id);
    const posFirst = ids.indexOf(first.id);
    const posSecond = ids.indexOf(second.id);
    const posThird = ids.indexOf(third.id);

    expect(posThird).toBeLessThan(posSecond);
    expect(posSecond).toBeLessThan(posFirst);
  });

  it('respects limit and returns nextOffset when more results exist', async () => {
    // S'assure qu'il y a assez de fichiers pour userA (certains ont déjà été créés ci-dessus)
    const currentCount = await filesRepository.countActiveByOwner(userAId);
    const needed = Math.max(0, 3 - currentCount);
    for (let i = 0; i < needed; i++) {
      await filesService.createPendingFile(userAId, uploadInput({ originalName: `extra-${i}.png` }));
    }

    const result = await filesService.listOwnedFiles(userAId, 2, 0);

    expect(result.items).toHaveLength(2);
    expect(result.nextOffset).toBe(2); // offset=0 + limit=2

    // Vérification de la page suivante
    const nextResult = await filesService.listOwnedFiles(userAId, 2, 2);
    expect(nextResult.items.length).toBeGreaterThanOrEqual(1);
  });

  it('items do not expose internal fields (storageKey, bucket, checksum, ownerId)', async () => {
    const result = await filesService.listOwnedFiles(userAId, 5, 0);

    for (const item of result.items) {
      expect(item).not.toHaveProperty('storageKey');
      expect(item).not.toHaveProperty('bucket');
      expect(item).not.toHaveProperty('checksum');
      expect(item).not.toHaveProperty('ownerId');
    }
  });

  it('returns 200 with an empty page when offset exceeds total count', async () => {
    const result = await filesService.listOwnedFiles(userAId, 20, 9999);

    expect(result.items).toHaveLength(0);
    expect(result.nextOffset).toBeNull();
  });
});
