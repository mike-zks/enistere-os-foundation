import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { AuthenticatedPrincipal } from '../contracts/authenticated-principal';
import { currentUserFactory } from './current-user.decorator';

function contextWith(principal: AuthenticatedPrincipal | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: principal }),
    }),
  } as unknown as ExecutionContext;
}

describe('currentUserFactory', () => {
  const principal: AuthenticatedPrincipal = { userId: 'user-1', sessionId: 'sess-1' };

  it('returns the full principal when no property is requested', () => {
    expect(currentUserFactory(undefined, contextWith(principal))).toEqual(principal);
  });

  it('returns a single property when requested', () => {
    expect(currentUserFactory('userId', contextWith(principal))).toBe('user-1');
  });

  it('throws a generic 401 when the principal is absent', () => {
    expect(() => currentUserFactory(undefined, contextWith(undefined))).toThrow(UnauthorizedException);
  });
});
