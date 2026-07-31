import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FileStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { PASSWORD_HASHER, PasswordHasher } from '../src/modules/auth/password/password-hasher';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/database/prisma.service';
import { ObjectStorage } from '../src/modules/files/storage/object-storage';
import { OBJECT_STORAGE } from '../src/modules/files/storage/object-storage.token';
import { PermissionsService } from '../src/modules/permissions/permissions.service';
import { RolesService } from '../src/modules/roles/roles.service';

const UPLOADER_EMAIL = 'files-upload-e2e@example.test';
const NOPERM_EMAIL = 'files-noperm-e2e@example.test';
const PASSWORD = 'Sup3rSecret-upload!';
// JPEG minimal (signature FF D8 FF) suffisant pour la détection et le stockage objet.
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);

describe('Files upload (e2e, MinIO + PostgreSQL)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let storage: ObjectStorage;
  let uploaderToken: string;
  let noPermToken: string;
  let uploaderId: string;

  async function login(email: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    const accessToken: string = res.body.data.accessToken;
    return accessToken;
  }

  async function cleanup(): Promise<void> {
    await prisma.storedFile.deleteMany({ where: { owner: { email: { in: [UPLOADER_EMAIL, NOPERM_EMAIL] } } } });
    await prisma.user.deleteMany({ where: { email: { in: [UPLOADER_EMAIL, NOPERM_EMAIL] } } });
    await prisma.role.deleteMany({ where: { code: 'uploader-e2e' } });
    await prisma.permission.deleteMany({ where: { code: 'files.upload' } });
  }

  beforeAll(async () => {
    // Bucket de test privé (création autorisée en e2e uniquement).
    const bucket = process.env.S3_BUCKET ?? 'enistere-files-test';
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
      await s3.send(new CreateBucketCommand({ Bucket: bucket }));
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
    const rolesService = app.get(RolesService);
    const permissionsService = app.get(PermissionsService);

    await cleanup();
    const passwordHash = await hasher.hash(PASSWORD);
    const uploader = await prisma.user.create({ data: { email: UPLOADER_EMAIL, passwordHash } });
    uploaderId = uploader.id;
    await prisma.user.create({ data: { email: NOPERM_EMAIL, passwordHash } });

    await permissionsService.createPermission({ code: 'files.upload', isSystem: true });
    const role = await rolesService.createRole({ code: 'uploader-e2e', name: 'Uploader' });
    await permissionsService.assignToRole(role.id, 'files.upload');
    await rolesService.assignRoleToUser(uploaderId, 'uploader-e2e');

    uploaderToken = await login(UPLOADER_EMAIL);
    noPermToken = await login(NOPERM_EMAIL);
  }, 60000);

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  it('uploads a valid JPEG: 201, VALIDATED, stored privately, no internals exposed', async () => {
    const res = await request(app.getHttpServer())
      .post('/files')
      .set('Authorization', `Bearer ${uploaderToken}`)
      .field('category', 'IMAGE')
      .attach('file', JPEG, 'photo.jpg')
      .expect(201);

    expect(res.body.data.status).toBe('VALIDATED');
    expect(res.body.data.mimeType).toBe('image/jpeg');
    expect(res.body.data.extension).toBe('jpg');
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain('storageKey');
    expect(raw).not.toContain('bucket');
    expect(raw).not.toContain('checksum');

    const row = await prisma.storedFile.findUnique({ where: { id: res.body.data.id } });
    expect(row?.status).toBe(FileStatus.VALIDATED);
    expect(row?.visibility).toBe('PRIVATE');
    expect(row?.checksum).toMatch(/^[0-9a-f]{64}$/);
    expect(row?.storageKey).not.toContain('photo');
    // L'objet est réellement présent dans le bucket privé.
    await expect(storage.objectExists(row!.bucket, row!.storageKey)).resolves.toBe(true);
  });

  it('rejects content not matching the declared category (real type wins)', async () => {
    await request(app.getHttpServer())
      .post('/files')
      .set('Authorization', `Bearer ${uploaderToken}`)
      .field('category', 'DOCUMENT')
      .attach('file', JPEG, 'doc.pdf')
      .expect(400)
      .expect(({ body }) => {
        expect(body.errorCode).toBe('FILE_CONTENT_TYPE_MISMATCH');
      });
  });

  it('rejects unrecognized content', async () => {
    await request(app.getHttpServer())
      .post('/files')
      .set('Authorization', `Bearer ${uploaderToken}`)
      .field('category', 'IMAGE')
      .attach('file', Buffer.from('not a real image, just text'), 'x.jpg')
      .expect(400)
      .expect(({ body }) => {
        expect(body.errorCode).toBe('FILE_CONTENT_TYPE_UNDETECTED');
      });
  });

  it('rejects an upload without files.upload permission (403)', async () => {
    await request(app.getHttpServer())
      .post('/files')
      .set('Authorization', `Bearer ${noPermToken}`)
      .field('category', 'IMAGE')
      .attach('file', JPEG, 'photo.jpg')
      .expect(403)
      .expect(({ body }) => {
        expect(body.errorCode).toBe('AUTH_FORBIDDEN');
      });
  });

  it('rejects an upload without a token (401)', async () => {
    await request(app.getHttpServer())
      .post('/files')
      .field('category', 'IMAGE')
      .attach('file', JPEG, 'photo.jpg')
      .expect(401);
  });
});
