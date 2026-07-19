import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AUTH_ERROR_CODES } from '../auth-error-codes';

/**
 * Guard de rate limiting des endpoints d'authentification (login, refresh).
 *
 * Étend `ThrottlerGuard` pour produire une erreur 429 au format standard
 * (`AUTH_RATE_LIMITED`) sans détail sensible. Ce n'est pas un guard d'accès :
 * il ne remplace pas le futur `JwtAuthGuard`. Chaque route sélectionne le
 * throttler nommé pertinent via `@SkipThrottle`.
 *
 * Le tracker par défaut s'appuie sur `request.ip`. Sans `trust proxy` activé,
 * `X-Forwarded-For` n'est pas pris en compte (choix prudent par défaut).
 */
@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected throwThrottlingException(): Promise<void> {
    throw new HttpException(
      {
        code: AUTH_ERROR_CODES.AUTH_RATE_LIMITED,
        message: 'Too many authentication attempts. Please try again later.',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
