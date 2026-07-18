import pino, { DestinationStream, Logger, LoggerOptions } from 'pino';

import { serializeError } from './error-serializer';
import { currentContextFields } from './request-context';
import { redactDeep } from './sensitive-fields';

/**
 * Fabrique du logger Pino (ADR-040). JSON par ligne sur stdout (HTTP) ou stderr (CLI). Redaction
 * profonde centralisée (`formatters.log`), sérialiseur d'erreur par liste blanche, contexte de
 * requête injecté automatiquement (`mixin`), timestamp ISO-8601 unique. Aucun transport distant.
 */
export interface AppLoggerConfig {
  level: string;
  serviceName: string;
  environment: string;
  pretty: boolean;
  /** true → stderr (CLI, préserve le JSON machine sur stdout) ; false → stdout (HTTP). */
  toStderr: boolean;
}

// Capture en mémoire pour les tests : activée AVANT la création du logger (boot).
let captureSink: string[] | null = null;
export function enableLogCapture(): string[] {
  captureSink = [];
  return captureSink;
}
export function disableLogCapture(): void {
  captureSink = null;
}

function buildOptions(config: AppLoggerConfig): LoggerOptions {
  return {
    level: config.level,
    base: { service: config.serviceName, environment: config.environment },
    messageKey: 'message',
    // Timestamp ISO-8601 unique (clé `timestamp`, pas de doublon).
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    formatters: {
      level: (label) => ({ level: label }),
      // Redaction profonde appliquée à chaque objet loggé (champs utilisateur + mixin).
      log: (object) => redactDeep(object),
    },
    serializers: { err: serializeError, error: serializeError },
    // Contexte de corrélation injecté dans chaque log (requestId/userId/sessionId/operationId).
    mixin: () => currentContextFields(),
  };
}

function buildDestination(config: AppLoggerConfig): DestinationStream {
  if (captureSink) {
    const sink = captureSink;
    return {
      write: (line: string): void => {
        sink.push(line);
      },
    };
  }
  if (config.pretty && config.environment !== 'production') {
    // Pretty-print : DÉVELOPPEMENT uniquement. Flux synchrone (pas de worker), dépendance dev.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const prettyFactory = require('pino-pretty') as (opts: Record<string, unknown>) => DestinationStream;
    return prettyFactory({ destination: config.toStderr ? 2 : 1, colorize: true, translateTime: 'SYS:standard' });
  }
  return pino.destination({ fd: config.toStderr ? 2 : 1, sync: false });
}

export function createPinoLogger(config: AppLoggerConfig): Logger {
  // Production : pretty TOUJOURS désactivé (JSON pur sur stdout/stderr).
  const effective: AppLoggerConfig = {
    ...config,
    pretty: config.environment === 'production' ? false : config.pretty,
  };
  return pino(buildOptions(effective), buildDestination(effective));
}
