import { ExecutionContext, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuditService } from '../../../audit/audit.service';
import { AuthorizationContextService } from '../../authorization/authorization-context.service';
import { RolesGuard } from './roles.guard';

function buildContext(request: unknown): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let authorizationContext: { forRequest: jest.Mock };
  let auditService: { record: jest.Mock };
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    authorizationContext = {
      forRequest: jest.fn().mockResolvedValue({ roleCodes: ['user'], permissionCodes: [] }),
    };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };
    guard = new RolesGuard(
      reflector as unknown as Reflector,
      authorizationContext as unknown as AuthorizationContextService,
      auditService as unknown as AuditService,
    );
  });

  it('allows when no role metadata is present', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(guard.canActivate(buildContext({ user: { userId: 'u' } }))).resolves.toBe(true);
    expect(authorizationContext.forRequest).not.toHaveBeenCalled();
  });

  it('allows when the user has one of the required roles (OR)', async () => {
    reflector.getAllAndOverride.mockReturnValue(['administrator', 'user']);

    await expect(
      guard.canActivate(buildContext({ user: { userId: 'u', sessionId: 's' } })),
    ).resolves.toBe(true);
  });

  it('denies with 403 and audits when no required role is held', async () => {
    reflector.getAllAndOverride.mockReturnValue(['administrator']);

    await expect(
      guard.canActivate(buildContext({ user: { userId: 'u', sessionId: 's' } })),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(auditService.record.mock.calls[0][0].eventType).toBe('AUTHORIZATION_ROLE_DENIED');
  });

  it('throws a server error when metadata is present but no principal (misconfiguration)', async () => {
    reflector.getAllAndOverride.mockReturnValue(['administrator']);

    await expect(guard.canActivate(buildContext({}))).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
