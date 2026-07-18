import { ExecutionContext, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuditService } from '../../audit/audit.service';
import { AuthorizationContextService } from '../../auth/authorization/authorization-context.service';
import { PermissionsGuard } from './permissions.guard';

function buildContext(request: unknown): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let authorizationContext: { forRequest: jest.Mock };
  let auditService: { record: jest.Mock };
  let guard: PermissionsGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    authorizationContext = {
      forRequest: jest.fn().mockResolvedValue({
        roleCodes: [],
        permissionCodes: ['users.read', 'audit.read'],
      }),
    };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };
    guard = new PermissionsGuard(
      reflector as unknown as Reflector,
      authorizationContext as unknown as AuthorizationContextService,
      auditService as unknown as AuditService,
    );
  });

  it('allows when no permission metadata is present', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(guard.canActivate(buildContext({ user: { userId: 'u' } }))).resolves.toBe(true);
    expect(authorizationContext.forRequest).not.toHaveBeenCalled();
  });

  it('allows when all required permissions are held (AND)', async () => {
    reflector.getAllAndOverride.mockReturnValue(['users.read', 'audit.read']);

    await expect(
      guard.canActivate(buildContext({ user: { userId: 'u', sessionId: 's' } })),
    ).resolves.toBe(true);
  });

  it('denies with 403 and audits when a required permission is missing', async () => {
    reflector.getAllAndOverride.mockReturnValue(['users.read', 'roles.manage']);

    await expect(
      guard.canActivate(buildContext({ user: { userId: 'u', sessionId: 's' } })),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(auditService.record.mock.calls[0][0].eventType).toBe('AUTHORIZATION_PERMISSION_DENIED');
  });

  it('throws a server error when metadata is present but no principal', async () => {
    reflector.getAllAndOverride.mockReturnValue(['users.read']);

    await expect(guard.canActivate(buildContext({}))).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
