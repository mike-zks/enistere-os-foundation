import { Body, Controller, Get, INestApplication, Post } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IsString } from 'class-validator';
import request from 'supertest';
import { App } from 'supertest/types';

import { configureApp } from './configure-app';

class EchoDto {
  @IsString()
  value!: string;
}

// Contrôleur minimal interne au test, pour exercer le pipeline configuré par
// configureApp (ValidationPipe + filtre + interceptor) sans dépendre d'AppModule.
@Controller('__bootstrap-test')
class BootstrapTestController {
  @Get('ok')
  ok(): { value: string } {
    return { value: 'ok' };
  }

  @Post('echo')
  echo(@Body() body: EchoDto): EchoDto {
    return body;
  }
}

describe('configureApp', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [BootstrapTestController],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('wraps successful responses in the standard success envelope', async () => {
    await request(app.getHttpServer())
      .get('/__bootstrap-test/ok')
      .expect(200)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.data).toEqual({ value: 'ok' });
        expect(typeof body.timestamp).toBe('string');
      });
  });

  it('accepts a valid payload', async () => {
    await request(app.getHttpServer())
      .post('/__bootstrap-test/echo')
      .send({ value: 'hello' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.data).toEqual({ value: 'hello' });
      });
  });

  it('rejects unknown fields with the standard error envelope (ValidationPipe)', async () => {
    await request(app.getHttpServer())
      .post('/__bootstrap-test/echo')
      .send({ value: 'hello', unexpected: 'x' })
      .expect(400)
      .expect(({ body }) => {
        expect(body.success).toBe(false);
        expect(body.statusCode).toBe(400);
        expect(body.errorCode).toBe('VALIDATION_ERROR');
      });
  });
});
