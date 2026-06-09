/** Marqueur stable de redaction (jamais la valeur réelle). */
export const REDACTED = '[Redacted]';

/** Nom de service par défaut (jamais un nom de projet dérivé en dur). */
export const DEFAULT_SERVICE_NAME = 'api-nestjs-core';

/** Token DI du logger Pino sous-jacent (séparé d'`AppLogger`). */
export const PINO_LOGGER = Symbol('PINO_LOGGER');

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
