import {
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { AUTH_ERROR_CODES } from '../auth-error-codes';
import { AuthenticatedPrincipal } from '../contracts/authenticated-principal';

/**
 * Guard d'authentification JWT (stratégie `jwt-access`).
 *
 * Respecte `@Public()`. Produit une 401 normalisée (`AUTH_UNAUTHORIZED`) sans exposer
 * les détails Passport. Ne contient aucune logique RBAC. Les `HttpException` levées par
 * la stratégie (déjà génériques) sont propagées telles quelles.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt-access') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = AuthenticatedPrincipal>(err: unknown, user: TUser | false): TUser {
    if (user) {
      return user;
    }

    if (err instanceof HttpException) {
      throw err;
    }

    throw new UnauthorizedException({
      code: AUTH_ERROR_CODES.AUTH_UNAUTHORIZED,
      message: 'Authentication required.',
    });
  }
}
