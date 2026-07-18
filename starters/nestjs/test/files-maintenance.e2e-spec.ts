import { randomUUID } from 'node:crypto';

import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FileStatus, FileVisibility, PrismaClient } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { PASSWORD_HASHER, PasswordHasher } from '../src/auth/password/password-hasher';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/database/prisma.service';
import { AppLogger } from '../src/common/logging/logging.service';
import {
  MaintenanceLockBusyError,
  MaintenanceLockService,
} from '../src/files/maintenance/maintenance-lock.service';
import { FilePurgeService } from '../src/files/reconciliation/file-purge.service';

// Logger no-op pour les instances de verrou créées directement (deux sessions PostgreSQL).
const lockLogger = { warn: () => undefined } as unknown as AppLogger;
import { ObjectStorage } from '../src/files/storage/object-storage';
import { OBJECT_STORAGE } from '../src/files/storage/object-storage.token';

const UPLOADER_EMAIL = 'files-quota-uploader-e2e@example.test';
const PASSWORD = 'Sup3rSecret-quota!';
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);
const UPLOADER_ROLE = 'quota-uploader-e2e';
const QUOTA_LIMIT = 3;

const BUCKET = process.env.S3_BUCKET ?? 'enistere-files-test';
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

function lockUrl(): string {
  const base = process.env.DATABASE_URL ?? '';
  // connection_limit=1 : une seule connexion → acquisition/libération fiables sur la même session.
  return base + (base.includes('?') ? '&' : '?') + 'connection_limit=1';
}

describe('Files maintenance, quotas & concurrency (e2e, MinIO + PostgreSQL)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let storage: ObjectStorage;
  let purge: FilePurgeService;
  let uploaderToken: string;
  let uploaderId: string;
  let previousQuota: string | undefined;

  async function login(email: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    return res.body.data.accessToken as string;
  }

  async function ensurePermissions(codes: string[]): Promise<Map<string, string>> {
    await prisma.permission.createMany({
      data: codes.map((code) => {
        const [resource, action] = code.split('.');
        return { code, resource, action, isSystem: true };
      }),
      skipDuplicates: true,
    });
    const rows = await prisma.permission.findMany({ where: { code: { in: codes } } });
    return new Map(rows.map((row) => [row.code, row.id]));
  }

  async function seedOldDeleted(withObject: boolean): Promise<{ id: string; storageKey: string }> {
    const storageKey = `test/IMAGE/2020/01/purge-${randomUUID()}.jpg`;
    if (withObject) {
      await storage.putObject({ bucket: BUCKET, storageKey, body: JPEG, contentType: 'image/jpeg' });
    }
    const old = new Date('2020-01-01T00:00:00.000Z');
    const file = await prisma.storedFile.create({
      data: {
        owner: { connect: { id: uploaderId } },
        originalName: 'old.jpg',
        storageKey,
        bucket: BUCKET,
        mimeType: 'image/jpeg',
        extension: 'jpg',
        size: BigInt(JPEG.length),
        visibility: FileVisibility.PRIVATE,
        status: FileStatus.DELETED,
        category: 'IMAGE',
        deletedAt: old,
        storageDeletedAt: old,
        createdAt: old,
      },
    });
    return { id: file.id, storageKey };
  }

  async function cleanup(): Promise<void> {
    await prisma.storedFile.deleteMany({ where: { owner: { email: UPLOADER_EMAIL } } });
    await prisma.user.deleteMany({ where: { email: UPLOADER_EMAIL } });
    await prisma.role.deleteMany({ where: { code: UPLOADER_ROLE } });
  }

  beforeAll(async () => {
    // Quota bas pour ce fichier de test ; lu par `configuration()` à l'init du module.
    previousQuota = process.env.FILES_OWNER_MAX_ACTIVE_FILES;
    process.env.FILES_OWNER_MAX_ACTIVE_FILES = String(QUOTA_LIMIT);

    const s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION ?? 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
      },
    });
    try {
      await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
    } catch {
      // déjà présent
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    storage = app.get<ObjectStorage>(OBJECT_STORAGE, { strict: false });
    purge = app.get(FilePurgeService);
    const hasher = app.get<PasswordHasher>(PASSWORD_HASHER);

    await cleanup();
    const passwordHash = await hasher.hash(PASSWORD);
    const uploader = await prisma.user.create({ data: { email: UPLOADER_EMAIL, passwordHash } });
    uploaderId = uploader.id;

    const perms = await ensurePermissions(['files.upload']);
    const role = await prisma.role.create({ data: { code: UPLOADER_ROLE, name: 'Quota Uploader' } });
    await prisma.rolePermission.create({
      data: { roleId: role.id, permissionId: perms.get('files.upload') as string },
    });
    await prisma.userRole.create({ data: { userId: uploaderId, roleId: role.id } });

    uploaderToken = await login(UPLOADER_EMAIL);
  }, 60000);

  afterAll(async () => {
    await cleanup();
    await app.close();
    if (previousQuota === undefined) {
      delete process.env.FILES_OWNER_MAX_ACTIVE_FILES;
    } else {
      process.env.FILES_OWNER_MAX_ACTIVE_FILES = previousQuota;
    }
  });

  // --- Advisory lock (deux sessions PostgreSQL distinctes) ---

  it('advisory lock: a second session is refused until the first releases', async () => {
    const a = new PrismaClient({ datasources: { db: { url: lockUrl() } } });
    const b = new PrismaClient({ datasources: { db: { url: lockUrl() } } });
    const lockA = new MaintenanceLockService(a as unknown as PrismaService, lockLogger);
    const lockB = new MaintenanceLockService(b as unknown as PrismaService, lockLogger);
    const name = `test-lock:${randomUUID()}`;
    try {
      await expect(lockA.tryAcquire(name)).resolves.toBe(true);
      await expect(lockB.tryAcquire(name)).resolves.toBe(false);
      await lockA.release(name);
      await expect(lockB.tryAcquire(name)).resolves.toBe(true);
      await lockB.release(name);
    } finally {
      await a.$disconnect();
      await b.$disconnect();
    }
  });

  it('withLock refuses a concurrent maintenance run (MaintenanceLockBusyError)', async () => {
    const a = new PrismaClient({ datasources: { db: { url: lockUrl() } } });
    const b = new PrismaClient({ datasources: { db: { url: lockUrl() } } });
    const lockA = new MaintenanceLockService(a as unknown as PrismaService, lockLogger);
    const lockB = new MaintenanceLockService(b as unknown as PrismaService, lockLogger);
    const name = `test-lock:${randomUUID()}`;
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    try {
      const held = lockA.withLock(name, () => gate);
      await sleep(100); // laisse A acquérir
      await expect(lockB.withLock(name, () => Promise.resolve('work'))).rejects.toBeInstanceOf(
        MaintenanceLockBusyError,
      );
      release();
      await held;
    } finally {
      await a.$disconnect();
      await b.$disconnect();
    }
  });

  // --- Quota par propriétaire sous concurrence (atomicité réelle) ---

  it('enforces the per-owner active-file quota under concurrent uploads (no overflow)', async () => {
    const attempts = QUOTA_LIMIT + 2;
    const results = await Promise.all(
      Array.from({ length: attempts }, (_unused, i) =>
        request(app.getHttpServer())
          .post('/files')
          .set('Authorization', `Bearer ${uploaderToken}`)
          .field('category', 'IMAGE')
          .attach('file', JPEG, `concurrent-${i}.jpg`),
      ),
    );

    const created = results.filter((r) => r.status === 201).length;
    const rejected = results.filter((r) => r.status === 409);
    expect(created).toBe(QUOTA_LIMIT);
    expect(rejected.length).toBe(attempts - QUOTA_LIMIT);
    expect(rejected.every((r) => r.body.errorCode === 'FILE_COUNT_QUOTA_EXCEEDED')).toBe(true);

    // La base ne dépasse JAMAIS le quota malgré la concurrence (vérification atomique).
    const active = await prisma.storedFile.count({
      where: {
        ownerId: uploaderId,
        deletedAt: null,
        status: { in: [FileStatus.PENDING, FileStatus.UPLOADED, FileStatus.VALIDATED, FileStatus.QUARANTINED] },
      },
    });
    expect(active).toBe(QUOTA_LIMIT);
  }, 30000);

  // --- Purge physique : politique objet-présent ---

  it('purges an old DELETED row only when its object is absent (keeps + signals otherwise)', async () => {
    const withObject = await seedOldDeleted(true);
    const withoutObject = await seedOldDeleted(false);

    const report = await purge.purgeMetadata({ dryRun: false });
    expect(report.dryRun).toBe(false);

    // Objet encore présent → ligne CONSERVÉE et incohérence signalée.
    await expect(prisma.storedFile.findUnique({ where: { id: withObject.id } })).resolves.not.toBeNull();
    expect(report.actions.some((a) => a.resource === withObject.id && a.action === 'report_only')).toBe(true);

    // Objet absent + rétention dépassée → ligne PURGÉE.
    await expect(prisma.storedFile.findUnique({ where: { id: withoutObject.id } })).resolves.toBeNull();
    expect(report.actions.some((a) => a.resource === withoutObject.id && a.action === 'purge_row')).toBe(true);

    // Nettoyage de l'objet de test restant.
    await storage.deleteObject(BUCKET, withObject.storageKey);
  });
});
