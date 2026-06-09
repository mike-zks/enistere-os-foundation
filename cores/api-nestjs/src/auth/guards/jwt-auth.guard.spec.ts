import { ExecutionContext, HttpException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { JwtAuthGuard } from './jwt-auth.guard';

function fakeContext(): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({
      getRequest: () => ({}),
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

function guardWith(isPublic: boolean): JwtAuthGuard {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(isPublic),
  } as unknown as Reflector;
  return new JwtAuthGuard(reflector);
}

describe('JwtAuthGuard', () => {
  it('allows a public route without authentication', () => {
    expect(guardWith(true).canActivate(fakeContext())).toBe(true);
  });

  it('returns the principal from handleRequest when present', () => {
    const principal = { userId: 'u', sessionId: 's' };
    expect(guardWith(false).handleRequest(null, principal)).toBe(principal);
  });

  it('throws a generic 401 when no user is resolved', () => {
    expect(() => guardWith(false).handleRequest(null, false)).toThrow(UnauthorizedException);
  });

  it('rethrows an HttpException raised by the strategy', () => {
    const error = new HttpException({ code: 'AUTH_UNAUTHORIZED' }, 401);
    expect(() => guardWith(false).handleRequest(error, false)).toThrow(error);
  });
});
