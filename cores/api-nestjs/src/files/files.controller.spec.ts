import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';

import { configureApp } from '../bootstrap/configure-app';
import { FileAccessService } from './access/file-access.service';
import { FileDeletionService } from './deletion/file-deletion.service';
import { FilesController } from './files.controller';
import { FileQuarantineService } from './quarantine/file-quarantine.service';
import { FileUploadService } from './upload/file-upload.service';

const FILE_ID = '11111111-1111-4111-8111-111111111111';

const publicFile = {
  id: FILE_ID,
  originalName: 'photo.jpg',
  mimeType: 'image/jpeg',
  extension: 'jpg',
  size: '6',
  visibility: 'PRIVATE',
  status: 'VALIDATED',
  category: 'IMAGE',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

const signedDownload = {
  url: 'https://minio.local/private-bucket/key?X-Amz-Signature=sig',
  expiresAt: '2026-06-01T00:05:00.000Z',
};

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

class StubAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: unknown }>();
    req.user = { userId: 'user-1', sessionId: 'sess-1' };
    return true;
  }
}

function throttlers(uploadLimit: number, downloadLimit = 1000) {
  return [
    { name: 'login', ttl: 60000, limit: 1000 },
    { name: 'refresh', ttl: 60000, limit: 1000 },
    { name: 'upload', ttl: 60000, limit: uploadLimit },
    { name: 'download', ttl: 60000, limit: downloadLimit },
  ];
}

function uploadStub() {
  return { upload: jest.fn().mockResolvedValue(publicFile) };
}

function accessStub() {
  return {
    getMetadata: jest.fn().mockResolvedValue(publicFile),
    issueDownloadUrl: jest.fn().mockResolvedValue(signedDownload),
  };
}

function deletionStub() {
  return { delete: jest.fn().mockResolvedValue(undefined) };
}

function quarantineStub() {
  return {
    quarantine: jest.fn().mockResolvedValue(undefined),
    restore: jest.fn().mockResolvedValue(undefined),
  };
}

describe('FilesController', () => {
  let app: INestApplication<App>;
  let uploadService: { upload: jest.Mock };
  let accessService: { getMetadata: jest.Mock; issueDownloadUrl: jest.Mock };
  let deletionService: { delete: jest.Mock };
  let quarantineService: { quarantine: jest.Mock; restore: jest.Mock };

  beforeAll(async () => {
    uploadService = uploadStub();
    accessService = accessStub();
    deletionService = deletionStub();
    quarantineService = quarantineStub();
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot(throttlers(1000))],
      controllers: [FilesController],
      providers: [
        { provide: FileUploadService, useValue: uploadService },
        { provide: FileAccessService, useValue: accessService },
        { provide: FileDeletionService, useValue: deletionService },
        { provide: FileQuarantineService, useValue: quarantineService },
        { provide: APP_GUARD, useClass: StubAuthGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('uploads a file (201) and returns the public contract', async () => {
    await request(app.getHttpServer())
      .post('/files')
      .field('category', 'IMAGE')
      .attach('file', JPEG, 'photo.jpg')
      .expect(201)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.data.status).toBe('VALIDATED');
        expect(body.data).not.toHaveProperty('storageKey');
        expect(body.data).not.toHaveProperty('bucket');
      });

    expect(uploadService.upload.mock.calls[0][0]).toBe('user-1');
  });

  it('returns 400 FILE_REQUIRED when no file is attached', async () => {
    await request(app.getHttpServer())
      .post('/files')
      .field('category', 'IMAGE')
      .expect(400)
      .expect(({ body }) => {
        expect(body.errorCode).toBe('FILE_REQUIRED');
      });
  });

  it('returns 400 for an invalid category (DTO validation)', async () => {
    await request(app.getHttpServer())
      .post('/files')
      .field('category', 'NOPE')
      .attach('file', JPEG, 'photo.jpg')
      .expect(400);
  });

  it('GET /files/:id returns the owned public metadata (no internals)', async () => {
    await request(app.getHttpServer())
      .get(`/files/${FILE_ID}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.data.id).toBe(FILE_ID);
        expect(body.data.status).toBe('VALIDATED');
        expect(body.data).not.toHaveProperty('storageKey');
        expect(body.data).not.toHaveProperty('bucket');
        expect(body.data).not.toHaveProperty('checksum');
        expect(body.data).not.toHaveProperty('ownerId');
      });

    expect(accessService.getMetadata).toHaveBeenCalledWith(FILE_ID, 'user-1');
  });

  it('GET /files/:id returns 400 for a malformed (non-UUID) id', async () => {
    await request(app.getHttpServer()).get('/files/not-a-uuid').expect(400);
  });

  it('POST /files/:id/download-url returns 200 with a non-cacheable signed URL (no internals)', async () => {
    await request(app.getHttpServer())
      .post(`/files/${FILE_ID}/download-url`)
      .expect(200)
      .expect('Cache-Control', 'no-store')
      .expect('Pragma', 'no-cache')
      .expect(({ body, headers }) => {
        expect(body.success).toBe(true);
        expect(body.data.url).toContain('X-Amz-Signature');
        expect(body.data).toHaveProperty('expiresAt');
        expect(body.data).not.toHaveProperty('bucket');
        expect(body.data).not.toHaveProperty('storageKey');
        expect(headers['referrer-policy']).toBe('no-referrer');
      });

    expect(accessService.issueDownloadUrl).toHaveBeenCalledWith(FILE_ID, 'user-1');
  });

  it('DELETE /files/:id returns 204 and delegates to the deletion service', async () => {
    await request(app.getHttpServer()).delete(`/files/${FILE_ID}`).expect(204);
    expect(deletionService.delete).toHaveBeenCalledWith(FILE_ID, 'user-1');
  });

  it('DELETE /files/:id returns 400 for a malformed id', async () => {
    await request(app.getHttpServer()).delete('/files/not-a-uuid').expect(400);
  });

  it('POST /files/:id/quarantine returns 200 with the bounded reason code', async () => {
    await request(app.getHttpServer())
      .post(`/files/${FILE_ID}/quarantine`)
      .send({ reasonCode: 'SECURITY_REVIEW' })
      .expect(200);
    expect(quarantineService.quarantine).toHaveBeenCalledWith(FILE_ID, 'user-1', 'SECURITY_REVIEW');
  });

  it('POST /files/:id/quarantine defaults the reason when omitted', async () => {
    await request(app.getHttpServer()).post(`/files/${FILE_ID}/quarantine`).send({}).expect(200);
    expect(quarantineService.quarantine).toHaveBeenLastCalledWith(FILE_ID, 'user-1', 'MANUAL_ACTION');
  });

  it('POST /files/:id/quarantine rejects an out-of-range reason code (400)', async () => {
    await request(app.getHttpServer())
      .post(`/files/${FILE_ID}/quarantine`)
      .send({ reasonCode: 'WHATEVER' })
      .expect(400);
  });

  it('POST /files/:id/restore returns 200 and delegates to the quarantine service', async () => {
    await request(app.getHttpServer()).post(`/files/${FILE_ID}/restore`).expect(200);
    expect(quarantineService.restore).toHaveBeenCalledWith(FILE_ID, 'user-1');
  });
});

describe('FilesController (upload rate limiting)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot(throttlers(2))],
      controllers: [FilesController],
      providers: [
        { provide: FileUploadService, useValue: uploadStub() },
        { provide: FileAccessService, useValue: accessStub() },
        { provide: FileDeletionService, useValue: deletionStub() },
        { provide: FileQuarantineService, useValue: quarantineStub() },
        { provide: APP_GUARD, useClass: StubAuthGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('throttles the upload route (429) once the limit is exceeded', async () => {
    await request(app.getHttpServer()).post('/files').field('category', 'IMAGE').attach('file', JPEG, 'a.jpg').expect(201);
    await request(app.getHttpServer()).post('/files').field('category', 'IMAGE').attach('file', JPEG, 'b.jpg').expect(201);
    await request(app.getHttpServer())
      .post('/files')
      .field('category', 'IMAGE')
      .attach('file', JPEG, 'c.jpg')
      .expect(429);
  });
});

describe('FilesController (download-url rate limiting)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot(throttlers(1000, 2))],
      controllers: [FilesController],
      providers: [
        { provide: FileUploadService, useValue: uploadStub() },
        { provide: FileAccessService, useValue: accessStub() },
        { provide: FileDeletionService, useValue: deletionStub() },
        { provide: FileQuarantineService, useValue: quarantineStub() },
        { provide: APP_GUARD, useClass: StubAuthGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('throttles the download-url route (429) on its own dedicated limit', async () => {
    await request(app.getHttpServer()).post(`/files/${FILE_ID}/download-url`).expect(200);
    await request(app.getHttpServer()).post(`/files/${FILE_ID}/download-url`).expect(200);
    await request(app.getHttpServer()).post(`/files/${FILE_ID}/download-url`).expect(429);
  });
});
