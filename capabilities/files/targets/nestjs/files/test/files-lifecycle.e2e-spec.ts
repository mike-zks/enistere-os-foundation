import { randomUUID } from 'node:crypto';

import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FileStatus, FileVisibility } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { PASSWORD_HASHER, PasswordHasher } from '../src/auth/password/password-hasher';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/database/prisma.service';
import { FileReconciliationService } from '../src/files/reconciliation/file-reconciliation.service';
import { ObjectStorage } from '../src/files/storage/object-storage';
import { OBJECT_STORAGE } from '../src/files/storage/object-storage.token';

const OWNER_EMAIL = 'files-lifecycle-owner-e2e@example.test';
const ADMIN_EMAIL = 'files-lifecycle-admin-e2e@example.test';
const NOPERM_EMAIL = 'files-lifecycle-noperm-e2e@example.test';
const PASSWORD = 'Sup3rSecret-lifecycle!';
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);

const OWNER_ROLE = 'lifecycle-owner-e2e';
const ADMIN_ROLE = 'lifecycle-admin-e2e';
const READER_ROLE = 'lifecycle-reader-e2e';

const BUCKET = process.env.S3_BUCKET ?? 'enistere-files-test';
const ENDPOINT = process.env.S3_ENDPOINT ?? 'http://localhost:9000';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

interface SeededFile {
  id: string;
  storageKey: string;
}

describe('Files lifecycle (e2e, MinIO + PostgreSQL)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let storage: ObjectStorage;
  let reconciler: FileReconciliationService;
  let ownerToken: string;
  let adminToken: string;
  let noPermToken: string;
  let ownerId: string;

  async function login(email: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    return res.body.data.accessToken as string;
  }

  async function ensurePermissions(codes: string[]): Promise<Map<string, string>> {
    // createMany + skipDuplicates : sûr en concurrence (INSERT ... ON CONFLICT DO NOTHING).
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

  async function createRole(code: string, name: string, permissionIds: string[], userId: string): Promise<void> {
    const role = await prisma.role.create({ data: { code, name } });
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
      skipDuplicates: true,
    });
    await prisma.userRole.create({ data: { userId, roleId: role.id } });
  }

  async function seedFile(opts: {
    status: FileStatus;
    withObject: boolean;
    keyHint?: string;
    createdAt?: Date;
    deletedAt?: Date | null;
  }): Promise<SeededFile> {
    const storageKey = `test/IMAGE/2026/06/${opts.keyHint ?? ''}${randomUUID()}.jpg`;
    if (opts.withObject) {
      await storage.putObject({ bucket: BUCKET, storageKey, body: JPEG, contentType: 'image/jpeg' });
    }
    const now = new Date();
    const file = await prisma.storedFile.create({
      data: {
        owner: { connect: { id: ownerId } },
        originalName: 'café photo.jpg',
        storageKey,
        bucket: BUCKET,
        mimeType: 'image/jpeg',
        extension: 'jpg',
        size: BigInt(JPEG.length),
        visibility: FileVisibility.PRIVATE,
        status: opts.status,
        category: 'IMAGE',
        checksum: 'a'.repeat(64),
        uploadedAt: opts.status === FileStatus.VALIDATED ? now : null,
        validatedAt: opts.status === FileStatus.VALIDATED ? now : null,
        createdAt: opts.createdAt,
        deletedAt: opts.deletedAt ?? null,
      },
    });
    return { id: file.id, storageKey };
  }

  async function cleanup(): Promise<void> {
    await prisma.storedFile.deleteMany({
      where: { owner: { email: { in: [OWNER_EMAIL, ADMIN_EMAIL, NOPERM_EMAIL] } } },
    });
    await prisma.user.deleteMany({ where: { email: { in: [OWNER_EMAIL, ADMIN_EMAIL, NOPERM_EMAIL] } } });
    await prisma.role.deleteMany({ where: { code: { in: [OWNER_ROLE, ADMIN_ROLE, READER_ROLE] } } });
  }

  beforeAll(async () => {
    const s3 = new S3Client({
      endpoint: ENDPOINT,
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
      // bucket déjà présent : ignoré
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    storage = app.get<ObjectStorage>(OBJECT_STORAGE, { strict: false });
    reconciler = app.get(FileReconciliationService);
    const hasher = app.get<PasswordHasher>(PASSWORD_HASHER);

    await cleanup();
    const passwordHash = await hasher.hash(PASSWORD);
    const owner = await prisma.user.create({ data: { email: OWNER_EMAIL, passwordHash } });
    ownerId = owner.id;
    const admin = await prisma.user.create({ data: { email: ADMIN_EMAIL, passwordHash } });
    const noPerm = await prisma.user.create({ data: { email: NOPERM_EMAIL, passwordHash } });

    const perms = await ensurePermissions([
      'files.read',
      'files.download',
      'files.delete',
      'files.quarantine',
      'files.restore',
    ]);
    const id = (code: string): string => perms.get(code) as string;

    await createRole(OWNER_ROLE, 'Owner', [id('files.read'), id('files.download'), id('files.delete')], ownerId);
    // Admin : quarantaine/restauration (administratif, SANS ownership) + `files.delete` pour prouver
    // que la permission seule ne permet PAS de supprimer le fichier d'autrui (ownership → 404).
    await createRole(
      ADMIN_ROLE,
      'Admin',
      [id('files.quarantine'), id('files.restore'), id('files.delete')],
      admin.id,
    );
    await createRole(READER_ROLE, 'Reader', [id('files.read')], noPerm.id);

    ownerToken = await login(OWNER_EMAIL);
    adminToken = await login(ADMIN_EMAIL);
    noPermToken = await login(NOPERM_EMAIL);
  }, 60000);

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  // --- Suppression ---

  it('deletes a file (object + DB), invalidates a previously issued URL, and is anti-enumerable', async () => {
    const f = await seedFile({ status: FileStatus.VALIDATED, withObject: true });

    const urlRes = await request(app.getHttpServer())
      .post(`/files/${f.id}/download-url`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    const url = urlRes.body.data.url as string;
    expect((await fetch(url)).status).toBe(200);

    await request(app.getHttpServer())
      .delete(`/files/${f.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(204);

    // Objet réellement supprimé du bucket.
    await expect(storage.objectExists(BUCKET, f.storageKey)).resolves.toBe(false);
    // L'ancienne URL signée ne sert plus le contenu (objet absent).
    expect((await fetch(url)).status).toBeGreaterThanOrEqual(400);
    // Plus de metadata, plus d'URL.
    await request(app.getHttpServer()).get(`/files/${f.id}`).set('Authorization', `Bearer ${ownerToken}`).expect(404);
    await request(app.getHttpServer())
      .post(`/files/${f.id}/download-url`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(404);
  });

  it('deletion is idempotent (second DELETE → 204)', async () => {
    const f = await seedFile({ status: FileStatus.VALIDATED, withObject: true });
    await request(app.getHttpServer()).delete(`/files/${f.id}`).set('Authorization', `Bearer ${ownerToken}`).expect(204);
    await request(app.getHttpServer()).delete(`/files/${f.id}`).set('Authorization', `Bearer ${ownerToken}`).expect(204);
  });

  it('another user cannot delete a file they do not own → 404', async () => {
    const f = await seedFile({ status: FileStatus.VALIDATED, withObject: true });
    await request(app.getHttpServer()).delete(`/files/${f.id}`).set('Authorization', `Bearer ${adminToken}`).expect(404);
    // Toujours présent pour le propriétaire.
    await request(app.getHttpServer()).get(`/files/${f.id}`).set('Authorization', `Bearer ${ownerToken}`).expect(200);
  });

  it('a user without files.delete cannot delete → 403', async () => {
    const f = await seedFile({ status: FileStatus.VALIDATED, withObject: true });
    await request(app.getHttpServer())
      .delete(`/files/${f.id}`)
      .set('Authorization', `Bearer ${noPermToken}`)
      .expect(403);
  });

  it('deletion requires authentication → 401', async () => {
    const f = await seedFile({ status: FileStatus.VALIDATED, withObject: true });
    await request(app.getHttpServer()).delete(`/files/${f.id}`).expect(401);
  });

  // --- Quarantaine / restauration (administratif) ---

  it('quarantines a validated file (admin, no ownership), blocking download until restore', async () => {
    const f = await seedFile({ status: FileStatus.VALIDATED, withObject: true });

    // Admin (ne possède pas le fichier) peut le mettre en quarantaine.
    await request(app.getHttpServer())
      .post(`/files/${f.id}/quarantine`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reasonCode: 'SECURITY_REVIEW' })
      .expect(200);

    // Le propriétaire voit le statut mais n'obtient plus d'URL.
    await request(app.getHttpServer())
      .get(`/files/${f.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200)
      .expect(({ body }) => expect(body.data.status).toBe('QUARANTINED'));
    await request(app.getHttpServer())
      .post(`/files/${f.id}/download-url`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(409)
      .expect(({ body }) => expect(body.errorCode).toBe('FILE_NOT_DOWNLOADABLE'));

    // Restauration (admin) → le propriétaire retrouve l'accès.
    await request(app.getHttpServer())
      .post(`/files/${f.id}/restore`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .post(`/files/${f.id}/download-url`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
  });

  it('quarantine requires files.quarantine (owner without it → 403)', async () => {
    const f = await seedFile({ status: FileStatus.VALIDATED, withObject: true });
    await request(app.getHttpServer())
      .post(`/files/${f.id}/quarantine`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({})
      .expect(403);
  });

  // --- Réconciliation DB ↔ S3 ---

  it('reconciliation detects then (on apply) rejects a VALIDATED row whose object vanished', async () => {
    const f = await seedFile({ status: FileStatus.VALIDATED, withObject: true });
    await storage.deleteObject(BUCKET, f.storageKey); // objet retiré directement de MinIO

    const dry = await reconciler.reconcile({ dryRun: true });
    expect(dry.actions.some((a) => a.resource === f.id && a.type === 'validated_object_missing')).toBe(true);
    // Dry-run ne mute rien.
    expect((await prisma.storedFile.findUnique({ where: { id: f.id } }))?.status).toBe(FileStatus.VALIDATED);

    await reconciler.reconcile({ dryRun: false });
    expect((await prisma.storedFile.findUnique({ where: { id: f.id } }))?.status).toBe(FileStatus.REJECTED);
  });

  it('reconciliation reports an orphan object in dry-run and deletes it on apply (if old enough)', async () => {
    const orphanKey = `test/IMAGE/2026/06/orphan-${randomUUID()}.jpg`;
    await storage.putObject({ bucket: BUCKET, storageKey: orphanKey, body: JPEG, contentType: 'image/jpeg' });
    await sleep(1200); // > FILES_ORPHAN_MIN_AGE_SECONDS (1s en test)

    const dry = await reconciler.reconcile({ dryRun: true });
    expect(dry.actions.some((a) => a.resource === orphanKey && a.type === 'orphan')).toBe(true);
    await expect(storage.objectExists(BUCKET, orphanKey)).resolves.toBe(true); // dry-run ne supprime pas

    await reconciler.reconcile({ dryRun: false });
    await expect(storage.objectExists(BUCKET, orphanKey)).resolves.toBe(false); // apply supprime l'orphelin
  }, 15000);

  it('cleanup-pending rejects an expired PENDING without object', async () => {
    const p = await seedFile({
      status: FileStatus.PENDING,
      withObject: false,
      createdAt: new Date('2020-01-01T00:00:00.000Z'),
    });
    const report = await reconciler.cleanupExpiredPending({ dryRun: false });
    expect(report.counts.pending_expired_no_object).toBeGreaterThanOrEqual(1);
    expect((await prisma.storedFile.findUnique({ where: { id: p.id } }))?.status).toBe(FileStatus.REJECTED);
  });

  it('never persists storage internals or URLs in the lifecycle audit logs', async () => {
    const logs = await prisma.auditLog.findMany({
      where: { eventType: { in: ['FILE_DELETED', 'FILE_QUARANTINED', 'FILE_RECONCILIATION_ACTION'] } },
    });
    expect(logs.length).toBeGreaterThan(0);
    for (const log of logs) {
      const serialized = JSON.stringify(log.metadata ?? {});
      expect(serialized).not.toContain('storageKey');
      expect(serialized).not.toContain('X-Amz-Signature');
      expect(serialized).not.toContain('http');
    }
  });

  // --- Concurrence ---

  it('handles two concurrent deletions: final state DELETED, object gone, no corruption', async () => {
    const f = await seedFile({ status: FileStatus.VALIDATED, withObject: true });

    const [a, b] = await Promise.all([
      request(app.getHttpServer()).delete(`/files/${f.id}`).set('Authorization', `Bearer ${ownerToken}`),
      request(app.getHttpServer()).delete(`/files/${f.id}`).set('Authorization', `Bearer ${ownerToken}`),
    ]);
    expect([a.status, b.status].every((status) => status === 204)).toBe(true);

    const row = await prisma.storedFile.findUnique({ where: { id: f.id } });
    expect(row?.status).toBe(FileStatus.DELETED);
    await expect(storage.objectExists(BUCKET, f.storageKey)).resolves.toBe(false);
  });

  it('concurrent quarantine + deletion resolves deterministically to DELETED', async () => {
    const f = await seedFile({ status: FileStatus.VALIDATED, withObject: true });

    await Promise.all([
      request(app.getHttpServer())
        .post(`/files/${f.id}/quarantine`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reasonCode: 'MANUAL_ACTION' }),
      request(app.getHttpServer()).delete(`/files/${f.id}`).set('Authorization', `Bearer ${ownerToken}`),
    ]);

    // La suppression l'emporte : un fichier DELETED ne redevient jamais QUARANTINED/VALIDATED.
    const row = await prisma.storedFile.findUnique({ where: { id: f.id } });
    expect(row?.status).toBe(FileStatus.DELETED);
  });
});
