import { Controller, Get, INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';

import { PASSWORD_HASHER, PasswordHasher } from '../src/auth/password/password-hasher';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/database/prisma.service';
import { Permissions } from '../src/permissions/decorators/permissions.decorator';
import { PermissionsService } from '../src/permissions/permissions.service';
import { Roles } from '../src/roles/decorators/roles.decorator';
import { RolesService } from '../src/roles/roles.service';

// Contrôleur de test, présent uniquement dans la suite e2e (pas dans le dépôt applicatif).
@Controller('test-authz')
class AuthorizationTestController {
  @Get('protected')
  protectedRoute(): { ok: true } {
    return { ok: true };
  }

  @Get('admin')
  @Roles('administrator')
  adminOnly(): { ok: true } {
    return { ok: true };
  }

  @Get('auditor')
  @Roles('auditor')
  auditorOnly(): { ok: true } {
    return { ok: true };
  }

  @Get('admin-or-auditor')
  @Roles('administrator', 'auditor')
  adminOrAuditor(): { ok: true } {
    return { ok: true };
  }

  @Get('needs-users-read')
  @Permissions('users.read')
  needsUsersRead(): { ok: true } {
    return { ok: true };
  }

  @Get('needs-perms-manage')
  @Permissions('permissions.manage')
  needsPermsManage(): { ok: true } {
    return { ok: true };
  }

  @Get('needs-two')
  @Permissions('users.read', 'roles.manage')
  needsTwo(): { ok: true } {
    return { ok: true };
  }
}

const EMAIL = 'auth-rbac-e2e@example.test';
const PASSWORD = 'Sup3rSecret-rbac!';

describe('Auth RBAC (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let rolesService: RolesService;
  let permissionsService: PermissionsService;
  let userId: string;
  let accessToken: string;

  function authGet(path: string, token: string | null = accessToken): request.Test {
    const req = request(app.getHttpServer()).get(path);
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  }

  async function login(): Promise<{ accessToken: string; refreshToken: string }> {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: EMAIL, password: PASSWORD })
      .expect(200);
    return { accessToken: res.body.data.accessToken, refreshToken: res.body.data.refreshToken };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [AuthorizationTestController],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);
    rolesService = app.get(RolesService);
    permissionsService = app.get(PermissionsService);
    const hasher = app.get<PasswordHasher>(PASSWORD_HASHER);

    // Nettoyage idempotent.
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await prisma.role.deleteMany({ where: { code: { in: ['administrator', 'auditor'] } } });
    await prisma.permission.deleteMany({
      where: { code: { in: ['users.read', 'audit.read', 'roles.manage', 'permissions.manage'] } },
    });

    const passwordHash = await hasher.hash(PASSWORD);
    const user = await prisma.user.create({ data: { email: EMAIL, passwordHash } });
    userId = user.id;

    await permissionsService.createPermission({ code: 'users.read', isSystem: true });
    await permissionsService.createPermission({ code: 'audit.read', isSystem: true });
    await permissionsService.createPermission({ code: 'roles.manage', isSystem: true });
    await permissionsService.createPermission({ code: 'permissions.manage', isSystem: true });

    const administrator = await rolesService.createRole({
      code: 'administrator',
      name: 'Administrator',
      isSystem: true,
    });
    await rolesService.createRole({ code: 'auditor', name: 'Auditor', isSystem: true });

    await permissionsService.assignToRole(administrator.id, 'users.read');
    await permissionsService.assignToRole(administrator.id, 'audit.read');
    await permissionsService.assignToRole(administrator.id, 'roles.manage');

    await rolesService.assignRoleToUser(userId, 'administrator');

    const tokens = await login();
    accessToken = tokens.accessToken;
  }, 30000);

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await prisma.role.deleteMany({ where: { code: { in: ['administrator', 'auditor'] } } });
    await prisma.permission.deleteMany({
      where: { code: { in: ['users.read', 'audit.read', 'roles.manage', 'permissions.manage'] } },
    });
    await app.close();
  });

  it('exposes roles and permissions via /auth/me/authorization', async () => {
    await authGet('/auth/me/authorization')
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.roles).toEqual(['administrator']);
        expect(body.data.permissions).toEqual(['audit.read', 'roles.manage', 'users.read']);
      });
  });

  it('allows an authenticated user on a route without role/permission metadata', async () => {
    await authGet('/test-authz/protected').expect(200);
  });

  it('allows a route whose required role is held', async () => {
    await authGet('/test-authz/admin').expect(200);
  });

  it('allows a route via the OR semantics of @Roles', async () => {
    await authGet('/test-authz/admin-or-auditor').expect(200);
  });

  it('denies (403) a route whose required role is missing', async () => {
    await authGet('/test-authz/auditor')
      .expect(403)
      .expect(({ body }) => {
        expect(body.errorCode).toBe('AUTH_FORBIDDEN');
      });
  });

  it('allows a route when all required permissions are held (AND)', async () => {
    await authGet('/test-authz/needs-two').expect(200);
  });

  it('denies (403) a route with a missing permission without revealing it', async () => {
    await authGet('/test-authz/needs-perms-manage')
      .expect(403)
      .expect(({ body }) => {
        expect(body.errorCode).toBe('AUTH_FORBIDDEN');
        expect(JSON.stringify(body)).not.toContain('permissions.manage');
      });
  });

  it('returns 401 (not 403) before authorization guards when no token is provided', async () => {
    await authGet('/test-authz/admin', null)
      .expect(401)
      .expect(({ body }) => {
        expect(body.errorCode).toBe('AUTH_UNAUTHORIZED');
      });
  });

  it('returns 401 (not 403) when the user is suspended', async () => {
    await prisma.user.update({ where: { id: userId }, data: { status: UserStatus.SUSPENDED } });
    try {
      await authGet('/test-authz/protected').expect(401);
    } finally {
      await prisma.user.update({ where: { id: userId }, data: { status: UserStatus.ACTIVE } });
    }
  });

  it('reflects a role change immediately without re-issuing the JWT', async () => {
    await rolesService.removeRoleFromUser(userId, 'administrator');
    try {
      await authGet('/test-authz/admin').expect(403);
    } finally {
      await rolesService.assignRoleToUser(userId, 'administrator');
    }
    await authGet('/test-authz/admin').expect(200);
  });

  it('reflects a permission removal immediately', async () => {
    const administrator = await rolesService.findByCode('administrator');
    if (!administrator) {
      throw new Error('administrator role missing');
    }
    await permissionsService.removeFromRole(administrator.id, 'users.read');
    try {
      await authGet('/test-authz/needs-users-read').expect(403);
    } finally {
      await permissionsService.assignToRole(administrator.id, 'users.read');
    }
    await authGet('/test-authz/needs-users-read').expect(200);
  });

  it('records an authorization denial audit event', async () => {
    await authGet('/test-authz/auditor').expect(403);
    const count = await prisma.auditLog.count({
      where: { eventType: { in: ['AUTHORIZATION_ROLE_DENIED', 'AUTHORIZATION_PERMISSION_DENIED'] } },
    });
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it('does not embed roles or permissions in the access token', () => {
    const payload = jwtService.decode(accessToken);
    expect(payload.sub).toBe(userId);
    expect(payload).not.toHaveProperty('roles');
    expect(payload).not.toHaveProperty('permissions');
  });

  it('invalidates access after logout (session check)', async () => {
    const fresh = await login();
    await authGet('/test-authz/admin', fresh.accessToken).expect(200);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: fresh.refreshToken })
      .expect(200);

    await authGet('/test-authz/admin', fresh.accessToken).expect(401);
  });

  it('never leaks sensitive fields in protected responses', async () => {
    const res = await authGet('/auth/me/authorization').expect(200);
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain('passwordHash');
    expect(raw).not.toContain('tokenHash');
  });
});
