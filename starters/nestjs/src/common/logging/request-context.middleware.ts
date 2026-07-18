import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';

import { AppConfig } from '../../config/configuration';
import { RequestContext, runWithRequestContext } from './request-context';
import { AppLogger, Level, LogFields } from './logging.service';

/**
 * Établit le contexte de corrélation par requête (`AsyncLocalStorage`) en réutilisant le
 * `X-Request-Id` posé en amont (jamais un second id), puis émet **un seul** log de fin de requête
 * sur `res 'finish'` : `requestId`, `method`, **route normalisée** (`req.route.path`, ex.
 * `/files/:id`), `statusCode`, `durationMs`. Aucun body/query/URL n'est journalisé. Niveau par
 * statut ; logs de succès `/health/*` réduits.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly httpEnabled: boolean;
  private readonly healthSuccessEnabled: boolean;

  constructor(
    private readonly logger: AppLogger,
    configService: ConfigService<AppConfig, true>,
  ) {
    this.httpEnabled = configService.get('logHttpEnabled', { infer: true });
    this.healthSuccessEnabled = configService.get('logHealthSuccessEnabled', { infer: true });
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Cast local (auto-suffisant) : `requestId` est posé par le middleware request-id en amont ;
    // `route` est renseigné par Express après le routage (route normalisée).
    const request = req as Request & { requestId?: string };
    const requestId = request.requestId;
    // Store mutable partagé : l'intercepteur d'auth y ajoute userId/sessionId pendant la requête.
    const store: RequestContext = { requestId };
    const start = process.hrtime.bigint();

    if (this.httpEnabled) {
      res.on('finish', () => {
        // `Request.route` est typé `any` côté Express : cast explicite vers un type concret.
        const route: string | undefined = (request.route as { path?: string } | undefined)?.path;
        const level = this.resolveLevel(res.statusCode, route);
        if (level === null) {
          return; // succès des sondes santé : supprimé par défaut.
        }
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        const fields: LogFields = {
          requestId,
          method: req.method,
          // Jamais l'URL brute : route normalisée si disponible, sinon omise (anti-fuite d'identifiants).
          route,
          statusCode: res.statusCode,
          durationMs: Math.round(durationMs * 100) / 100,
        };
        // UUID uniquement (renseignés après authentification) ; jamais email/rôles/token.
        if (store.userId) {
          fields.userId = store.userId;
        }
        if (store.sessionId) {
          fields.sessionId = store.sessionId;
        }
        this.logger.logHttp(level, fields);
      });
    }

    runWithRequestContext(store, () => next());
  }

  private resolveLevel(statusCode: number, route: string | undefined): Level | null {
    if (statusCode >= 500) {
      return 'error';
    }
    if (statusCode === 429) {
      return 'warn';
    }
    const isHealth = route === '/health' || (route?.startsWith('/health/') ?? false);
    if (isHealth && statusCode < 400) {
      return this.healthSuccessEnabled ? 'debug' : null;
    }
    return 'info'; // 2xx/3xx/4xx attendus
  }
}
