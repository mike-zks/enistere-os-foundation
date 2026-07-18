import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

import { ERROR_CODES } from '../common/errors/error-codes';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { AppLogger } from '../common/logging/logging.service';
import { requestIdMiddleware } from '../common/middleware/request-id.middleware';

/**
 * Configuration applicative commune à l'exécution (`main.ts`) et aux tests.
 *
 * Centralise les éléments réellement partagés :
 * - durcissement HTTP : Helmet (en-têtes de sécurité), `X-Powered-By` désactivé, limites de body
 *   parsers, `trust proxy` explicite, identifiant de corrélation `X-Request-Id` ;
 * - `ValidationPipe` global (ADR-003) ;
 * - filtre d'exception global (enveloppe d'erreur `08_STANDARDS.md` §30) ;
 * - interceptor de réponse global (enveloppe de succès).
 *
 * Les éléments dépendants du runtime (CORS, port) ou exposés différemment
 * selon le contexte (Swagger) restent configurés dans `main.ts`.
 *
 * Les réglages d'infrastructure sont lus depuis `process.env` (déjà validé par `validateEnv` au
 * chargement d'`AppModule`), comme les options Multer du contrôleur fichiers : configureApp reste
 * ainsi utilisable dans les modules de test minimaux sans dépendre de `ConfigService`.
 *
 * Aucun préfixe global n'est appliqué : le starter n'en utilise pas encore.
 */
export function configureApp(app: INestApplication): void {
  const expressApp = app as NestExpressApplication;

  // En-têtes de sécurité. CSP désactivée : l'API sert du JSON ; la seule UI HTML est le Swagger de
  // développement (désactivé en production) — éviter de casser ses assets. Une CSP pour une page
  // servie relèverait du reverse proxy / Swagger, pas du JSON applicatif.
  expressApp.use(helmet({ contentSecurityPolicy: false }));
  // Ne pas divulguer la stack applicative.
  expressApp.disable('x-powered-by');

  // `trust proxy` explicite : nombre de proxys de confiance (Traefik). 0 = aucun (X-Forwarded-For
  // ignoré → request.ip = adresse du socket). Jamais une confiance aveugle (`true`).
  expressApp.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 0));

  // Limites explicites des body parsers (le multipart est borné séparément par Multer).
  expressApp.useBodyParser('json', { limit: process.env.JSON_BODY_LIMIT ?? '1mb' });
  expressApp.useBodyParser('urlencoded', {
    extended: true,
    limit: process.env.URL_ENCODED_BODY_LIMIT ?? '1mb',
  });

  // Identifiant de corrélation (validé-ou-généré), exposé en réponse et disponible aux logs/audit.
  expressApp.use(requestIdMiddleware);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
      exceptionFactory: (errors) =>
        new BadRequestException({
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid request payload.',
          errors: errors.map((error) => ({
            property: error.property,
            constraints: error.constraints ?? {},
          })),
        }),
    }),
  );

  // Logger optionnel pour le filtre : présent dans l'app complète (LoggingModule global), absent
  // dans les modules de test minimaux — la résolution est défensive pour rester réutilisable.
  let logger: AppLogger | undefined;
  try {
    logger = app.get(AppLogger, { strict: false });
  } catch {
    logger = undefined;
  }

  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.useGlobalInterceptors(new ResponseInterceptor());
}
