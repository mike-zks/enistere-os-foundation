import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

import { AuditService } from '../../audit/audit.service';
import { AppConfig } from '../../config/configuration';
import { RefreshSessionService } from '../sessions/refresh-session.service';
import { JwtAccessStrategy } from './jwt-access.strategy';

const SUB = '11111111-1111-1111-1111-111111111111';
const SID = '22222222-2222-2222-2222-222222222222';

describe('JwtAccessStrategy', () => {
  let refreshSessionService: { validateAccessSession: jest.Mock };
  let auditService: { record: jest.Mock };
  let strategy: JwtAccessStrategy;

  const request = { ip: '127.0.0.1', headers: {} } as unknown as Request;

  beforeEach(() => {
    refreshSessionService = { validateAccessSession: jest.fn().mockResolvedValue(true) };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };
    const configService = {
      get: () => 'test-access-secret',
    } as unknown as ConfigService<AppConfig, true>;

    strategy = new JwtAccessStrategy(
      configService,
      refreshSessionService as unknown as RefreshSessionService,
      auditService as unknown as AuditService,
    );
  });

  it('returns a minimal principal for valid claims and an active session', async () => {
    const principal = await strategy.validate(request, { sub: SUB, sid: SID, typ: 'access' });

    expect(principal).toEqual({ userId: SUB, sessionId: SID });
    expect(Object.keys(principal)).toEqual(['userId', 'sessionId']);
    expect(refreshSessionService.validateAccessSession).toHaveBeenCalledWith(SID, SUB);
  });

  it.each([
    ['a refresh-typed token', { sub: SUB, sid: SID, typ: 'refresh' }],
    ['an invalid sub', { sub: 'not-a-uuid', sid: SID, typ: 'access' }],
    ['an invalid sid', { sub: SUB, sid: 'not-a-uuid', typ: 'access' }],
    ['missing claims', { sub: SUB }],
  ])('rejects %s without checking the session', async (_label, payload) => {
    await expect(strategy.validate(request, payload)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(refreshSessionService.validateAccessSession).not.toHaveBeenCalled();
  });

  it('rejects when the session is invalid and audits the rejection', async () => {
    refreshSessionService.validateAccessSession.mockResolvedValue(false);

    await expect(
      strategy.validate(request, { sub: SUB, sid: SID, typ: 'access' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(auditService.record).toHaveBeenCalled();
  });
});
