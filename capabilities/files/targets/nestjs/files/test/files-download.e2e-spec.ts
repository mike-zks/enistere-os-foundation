import { randomUUID } from 'node:crypto';

import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FileStatus, FileVisibility } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { PASSWORD_HASHER, PasswordHasher } from '../src/modules/auth/password/password-hasher';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/database/prisma.service';
import { ObjectStorage } from '../src/modules/files/storage/object-storage';
import { OBJECT_STORAGE } from '../src/modules/files/storage/object-storage.token';

const OWNER_EMAIL = 'files-download-owner-e2e@example.test';
const OTHER_EMAIL = 'files-download-other-e2e@example.test';
const NODL_EMAIL = 'files-download-noperm-e2e@example.test';
const PASSWORD = 'Sup3rSecret-download!';
// JPEG minimal (signature FF D8 FF) suffisant pour la détection et le stockage objet.
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);
const DOWNLOADER_ROLE = 'downloader-e2e';
const READER_ROLE = 'reader-e2e';

const BUCKET = process.env.S3_BUCKET ?? 'enistere-files-test';
const ENDPOINT = process.env.S3_ENDPOINT ?? 'http://localhost:9000';

interface SeededFile {
  id: string;
  storageKey: string;
}

describe('Files download (e2e, MinIO + PostgreSQL)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let storage: ObjectStorage;
  let ownerToken: string;
  let otherToken: string;
  let noDownloadToken: string;
  let ownerId: string;

  // Fichiers de référence pré-positionnés (sans passer par l'endpoint d'upload).
  let validated: SeededFile;
  let rejected: SeededFile;
  let quarantined: SeededFile;
  let softDeleted: SeededFile;
  let missingObject: SeededFile;

  async function login(email: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    return res.body.data.accessToken as string;
  }

  async function ensurePermission(code: string): Promise<string> {
    const [resource, action] = code.split('.');
    const permission = await prisma.permission.upsert({
      where: { code },
      create: { code, resource, action, isSystem: true },
      update: {},
    });
    return permission.id;
  }

  async function seedFile(opts: {
    status: FileStatus;
    visibility?: FileVisibility;
    deletedAt?: Date | null;
    withObject: boolean;
  }): Promise<SeededFile> {
    const storageKey = `test/IMAGE/2026/06/${randomUUID()}.jpg`;
    if (opts.withObject) {
      await storage.putObject({ bucket: BUCKET, storageKey, body: JPEG, contentType: 'image/jpeg' });
    }
    const now = new Date();
    const file = await prisma.storedFile.create({
      data: {
        owner: { connect: { id: ownerId } },
        // Nom volontairement accentué + espace : exerce le repli ASCII / RFC 5987 du header.
        originalName: 'café photo.jpg',
        storageKey,
        bucket: BUCKET,
        mimeType: 'image/jpeg',
        extension: 'jpg',
        size: BigInt(JPEG.length),
        visibility: opts.visibility ?? FileVisibility.PRIVATE,
        status: opts.status,
        category: 'IMAGE',
        checksum: 'a'.repeat(64),
        uploadedAt: opts.status === FileStatus.VALIDATED ? now : null,
        validatedAt: opts.status === FileStatus.VALIDATED ? now : null,
        rejectedAt: opts.status === FileStatus.REJECTED ? now : null,
        deletedAt: opts.deletedAt ?? null,
      },
    });
    return { id: file.id, storageKey };
  }

  async function cleanup(): Promise<void> {
    await prisma.storedFile.deleteMany({
      where: { owner: { email: { in: [OWNER_EMAIL, OTHER_EMAIL, NODL_EMAIL] } } },
    });
    await prisma.user.deleteMany({ where: { email: { in: [OWNER_EMAIL, OTHER_EMAIL, NODL_EMAIL] } } });
    await prisma.role.deleteMany({ where: { code: { in: [DOWNLOADER_ROLE, READER_ROLE] } } });
  }

  beforeAll(async () => {
    // Bucket privé de test (création autorisée en e2e uniquement).
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
    const hasher = app.get<PasswordHasher>(PASSWORD_HASHER);

    await cleanup();
    const passwordHash = await hasher.hash(PASSWORD);
    const owner = await prisma.user.create({ data: { email: OWNER_EMAIL, passwordHash } });
    ownerId = owner.id;
    const other = await prisma.user.create({ data: { email: OTHER_EMAIL, passwordHash } });
    const noDownload = await prisma.user.create({ data: { email: NODL_EMAIL, passwordHash } });

    // Permissions propres à cette suite (files.read/files.download) — aucune collision avec
    // la suite d'upload (qui ne touche que files.upload). Modèle d'accès = permission + ownership.
    const readId = await ensurePermission('files.read');
    const downloadId = await ensurePermission('files.download');

    const downloader = await prisma.role.create({ data: { code: DOWNLOADER_ROLE, name: 'Downloader' } });
    await prisma.rolePermission.createMany({
      data: [
        { roleId: downloader.id, permissionId: readId },
        { roleId: downloader.id, permissionId: downloadId },
      ],
      skipDuplicates: true,
    });
    // Le propriétaire ET l'autre utilisateur ont la permission : l'ownership reste décisif.
    await prisma.userRole.createMany({
      data: [
        { userId: ownerId, roleId: downloader.id },
        { userId: other.id, roleId: downloader.id },
      ],
      skipDuplicates: true,
    });

    // Rôle avec files.read mais SANS files.download : le propriétaire sans permission est refusé.
    const reader = await prisma.role.create({ data: { code: READER_ROLE, name: 'Reader' } });
    await prisma.rolePermission.create({ data: { roleId: reader.id, permissionId: readId } });
    await prisma.userRole.create({ data: { userId: noDownload.id, roleId: reader.id } });

    validated = await seedFile({ status: FileStatus.VALIDATED, withObject: true });
    rejected = await seedFile({ status: FileStatus.REJECTED, withObject: false });
    quarantined = await seedFile({ status: FileStatus.QUARANTINED, withObject: false });
    softDeleted = await seedFile({ status: FileStatus.DELETED, deletedAt: new Date(), withObject: false });
    missingObject = await seedFile({ status: FileStatus.VALIDATED, withObject: false });

    ownerToken = await login(OWNER_EMAIL);
    otherToken = await login(OTHER_EMAIL);
    noDownloadToken = await login(NODL_EMAIL);
  }, 60000);

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  // --- GET /files/:id (metadata) ---

  it('GET /files/:id returns owned metadata (status visible), no internals', async () => {
    const res = await request(app.getHttpServer())
      .get(`/files/${validated.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(res.body.data.status).toBe('VALIDATED');
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain('storageKey');
    expect(raw).not.toContain('bucket');
    expect(raw).not.toContain('checksum');
    expect(raw).not.toContain('ownerId');
  });

  it('owner can read metadata of a non-downloadable (REJECTED) file', async () => {
    await request(app.getHttpServer())
      .get(`/files/${rejected.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200)
      .expect(({ body }) => expect(body.data.status).toBe('REJECTED'));
  });

  it('GET metadata of another user file → 404 (anti-enumeration)', async () => {
    await request(app.getHttpServer())
      .get(`/files/${validated.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);
  });

  it('GET metadata of a soft-deleted file → 404', async () => {
    await request(app.getHttpServer())
      .get(`/files/${softDeleted.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(404);
  });

  it('GET metadata without a token → 401', async () => {
    await request(app.getHttpServer()).get(`/files/${validated.id}`).expect(401);
  });

  // --- POST /files/:id/download-url + téléchargement réel ---

  it('issues a short signed URL, not cacheable, that really downloads the object', async () => {
    const res = await request(app.getHttpServer())
      .post(`/files/${validated.id}/download-url`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200)
      .expect('Cache-Control', 'no-store')
      .expect('Pragma', 'no-cache');

    const { url, expiresAt } = res.body.data as { url: string; expiresAt: string };
    expect(typeof url).toBe('string');
    // Réponse strictement minimale : seuls `url` + `expiresAt`. Aucun champ interne nommé.
    // (Une URL présignée embarque nécessairement bucket+clé dans son chemin : c'est par
    // conception ; ce qui compte est de ne pas exposer de champ interne ni le checksum.)
    const data = res.body.data as Record<string, unknown>;
    expect(Object.keys(data).sort()).toEqual(['expiresAt', 'url']);
    expect(data).not.toHaveProperty('bucket');
    expect(data).not.toHaveProperty('storageKey');
    expect(data).not.toHaveProperty('checksum');
    expect(data).not.toHaveProperty('ownerId');
    // Le checksum interne (ici 64 'a') ne fuit nulle part dans la réponse.
    expect(JSON.stringify(res.body)).not.toContain('a'.repeat(64));

    // Expiration courte : entre quelques secondes et la borne max V1 (900 s), jamais permanente.
    const ttlMs = new Date(expiresAt).getTime() - Date.now();
    expect(ttlMs).toBeGreaterThan(5_000);
    expect(ttlMs).toBeLessThanOrEqual(900_000);

    // Téléchargement HTTP réel via l'URL signée (fetch natif).
    const download = await fetch(url);
    expect(download.status).toBe(200);
    expect(download.headers.get('content-type')).toContain('image/jpeg');
    const disposition = download.headers.get('content-disposition') ?? '';
    expect(disposition).toContain('attachment');
    expect(disposition).toContain("filename*=UTF-8''");
    const body = Buffer.from(await download.arrayBuffer());
    expect(body.equals(JPEG)).toBe(true);
  }, 30000);

  it('keeps the bucket private: the unsigned object URL is refused', async () => {
    const unsigned = await fetch(`${ENDPOINT}/${BUCKET}/${validated.storageKey}`);
    expect(unsigned.status).toBeGreaterThanOrEqual(400);
    expect(unsigned.status).toBeLessThan(500);
  });

  it('never persists the signed URL in the audit logs', async () => {
    const logs = await prisma.auditLog.findMany({ where: { resourceId: validated.id } });
    const issued = logs.filter((l) => l.eventType === 'FILE_DOWNLOAD_URL_ISSUED');
    expect(issued.length).toBeGreaterThanOrEqual(1);
    for (const log of logs) {
      const serialized = JSON.stringify(log.metadata ?? {});
      expect(serialized).not.toContain('X-Amz-Signature');
      expect(serialized).not.toContain('http');
      expect(serialized).not.toContain(validated.storageKey);
      expect(serialized).not.toContain(BUCKET);
    }
  });

  it('another user cannot get a download URL for a file they do not own → 404', async () => {
    await request(app.getHttpServer())
      .post(`/files/${validated.id}/download-url`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);
  });

  it('a user without files.download cannot get a URL → 403', async () => {
    await request(app.getHttpServer())
      .post(`/files/${validated.id}/download-url`)
      .set('Authorization', `Bearer ${noDownloadToken}`)
      .expect(403)
      .expect(({ body }) => expect(body.errorCode).toBe('AUTH_FORBIDDEN'));
  });

  it('a REJECTED file is not downloadable → 409', async () => {
    await request(app.getHttpServer())
      .post(`/files/${rejected.id}/download-url`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(409)
      .expect(({ body }) => expect(body.errorCode).toBe('FILE_NOT_DOWNLOADABLE'));
  });

  it('a QUARANTINED file is not downloadable → 409', async () => {
    await request(app.getHttpServer())
      .post(`/files/${quarantined.id}/download-url`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(409)
      .expect(({ body }) => expect(body.errorCode).toBe('FILE_NOT_DOWNLOADABLE'));
  });

  it('a soft-deleted file → 404 (anti-enumeration before any status disclosure)', async () => {
    await request(app.getHttpServer())
      .post(`/files/${softDeleted.id}/download-url`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(404);
  });

  it('a missing storage object → generic 503 and a technical audit', async () => {
    await request(app.getHttpServer())
      .post(`/files/${missingObject.id}/download-url`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(503)
      .expect(({ body }) => expect(body.errorCode).toBe('FILE_SIGNED_URL_GENERATION_FAILED'));

    const logs = await prisma.auditLog.findMany({ where: { resourceId: missingObject.id } });
    expect(logs.some((l) => l.eventType === 'FILE_STORAGE_OBJECT_MISSING')).toBe(true);
  });

  it('an object deleted directly in MinIO yields a generic 503 (no inconsistency exposed)', async () => {
    const file = await seedFile({ status: FileStatus.VALIDATED, withObject: true });
    await storage.deleteObject(BUCKET, file.storageKey);

    await request(app.getHttpServer())
      .post(`/files/${file.id}/download-url`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(503)
      .expect(({ body }) => expect(body.errorCode).toBe('FILE_SIGNED_URL_GENERATION_FAILED'));
  });

  // --- Expiration réelle (au niveau du stockage, TTL court pour rester rapide et stable) ---

  it('a signed URL is rejected by MinIO once it has expired', async () => {
    const signed = await storage.createSignedReadUrl({
      bucket: BUCKET,
      storageKey: validated.storageKey,
      expiresInSeconds: 2,
      responseContentType: 'image/jpeg',
    });

    const immediate = await fetch(signed.url);
    expect(immediate.status).toBe(200);

    await new Promise((resolve) => setTimeout(resolve, 3500));

    const expired = await fetch(signed.url);
    expect(expired.status).toBeGreaterThanOrEqual(400);
  }, 15000);
});
