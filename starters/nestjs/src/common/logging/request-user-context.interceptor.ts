import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

import { setAuthenticatedContext } from './request-context';

/**
 * Enrichit le contexte de corrélation après authentification : ajoute `userId`/`sessionId` (UUID
 * uniquement) au contexte de requête, pour qu'ils apparaissent dans les logs applicatifs suivants.
 * Ne journalise rien lui-même ; jamais d'email, de rôles/permissions ni de token. S'exécute après
 * les guards (donc `req.user` est disponible) et dans le même contexte asynchrone que la requête.
 */
@Injectable()
export class RequestUserContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ user?: { userId?: string; sessionId?: string } }>();
    const user = request.user;
    if (user?.userId) {
      setAuthenticatedContext(user.userId, user.sessionId);
    }
    return next.handle();
  }
}
