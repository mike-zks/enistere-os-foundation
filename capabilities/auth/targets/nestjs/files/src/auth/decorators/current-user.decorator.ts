import { ExecutionContext, UnauthorizedException, createParamDecorator } from '@nestjs/common';

import { AUTH_ERROR_CODES } from '../auth-error-codes';
import { AuthenticatedPrincipal, AuthenticatedRequest } from '../contracts/authenticated-principal';

/**
 * Injecte le principal authentifié (ou l'une de ses propriétés) depuis la requête.
 *
 * Usage : `@CurrentUser() principal: AuthenticatedPrincipal`
 *         `@CurrentUser('userId') userId: string`
 *
 * Aucune dépendance à Prisma. Lève une 401 générique si le principal est absent
 * (route mal protégée) afin de ne jamais exposer un handler protégé sans identité.
 */
export function currentUserFactory(
  property: keyof AuthenticatedPrincipal | undefined,
  context: ExecutionContext,
): AuthenticatedPrincipal | string {
  const request = context.switchToHttp().getRequest<Partial<AuthenticatedRequest>>();
  const principal = request.user;

  if (!principal) {
    throw new UnauthorizedException({
      code: AUTH_ERROR_CODES.AUTH_UNAUTHORIZED,
      message: 'Authentication required.',
    });
  }

  return property ? principal[property] : principal;
}

export const CurrentUser = createParamDecorator(currentUserFactory);
