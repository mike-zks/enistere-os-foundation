export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  corsOrigins: string;
  // Sécurité HTTP transverse. Limites des body parsers (format Express, ex. '1mb').
  jsonBodyLimit: string;
  urlEncodedBodyLimit: string;
  // Nombre de proxys de confiance devant l'API (Traefik). 0 = ne fait confiance à aucun proxy.
  trustProxyHops: number;
  // Logging structuré (ADR-040). Nom de service, niveau, pretty (dev), logs HTTP et santé.
  serviceName: string;
  logLevel: string;
  logPretty: boolean;
  logHttpEnabled: boolean;
  logHealthSuccessEnabled: boolean;
}

/**
 * Configuration de la baseline `base` : runtime HTTP, base de données, CORS et
 * logging uniquement. Les capabilities composées (Auth, ...) portent leur propre
 * configuration namespace auto-validée (`registerAs`), déclarée par leur overlay.
 */
export const configuration = (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? '',
  corsOrigins: process.env.CORS_ORIGINS ?? '',
  jsonBodyLimit: process.env.JSON_BODY_LIMIT ?? '1mb',
  urlEncodedBodyLimit: process.env.URL_ENCODED_BODY_LIMIT ?? '1mb',
  trustProxyHops: Number(process.env.TRUST_PROXY_HOPS ?? 0),
  serviceName: process.env.SERVICE_NAME ?? 'api-nestjs-core',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  logPretty: (process.env.LOG_PRETTY ?? 'false') === 'true',
  logHttpEnabled: (process.env.LOG_HTTP_ENABLED ?? 'true') === 'true',
  logHealthSuccessEnabled: (process.env.LOG_HEALTH_SUCCESS_ENABLED ?? 'false') === 'true',
});
