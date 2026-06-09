import { Injectable, LoggerService } from '@nestjs/common';
import { Logger } from 'pino';

export type Level = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export type LogFields = Record<string, unknown>;

/**
 * Logger applicatif officiel (ADR-040). Enveloppe Pino et implémente `LoggerService` (NestJS) pour
 * remplacer le logger interne. Deux usages réconciliés par détection du premier argument :
 * - **structuré** (recommandé) : `logger.info({ operation, count }, 'message')` ;
 * - **NestJS** (logs internes) : `log(message, context)`, `error(message, stack, context)`.
 *
 * Le contexte de requête (requestId/userId/sessionId) est injecté automatiquement par Pino (mixin),
 * sans passage manuel. La redaction est centralisée dans la configuration Pino.
 */
@Injectable()
export class AppLogger implements LoggerService {
  constructor(private readonly logger: Logger) {}

  info(first: LogFields | string, message?: string): void {
    this.record('info', first, message ? [message] : []);
  }
  warn(first: LogFields | string, ...rest: unknown[]): void {
    this.record('warn', first, rest);
  }
  error(first: LogFields | string, ...rest: unknown[]): void {
    this.record('error', first, rest);
  }
  debug(first: LogFields | string, ...rest: unknown[]): void {
    this.record('debug', first, rest);
  }
  trace(first: LogFields | string, ...rest: unknown[]): void {
    this.record('trace', first, rest);
  }
  fatal(first: LogFields | string, ...rest: unknown[]): void {
    this.record('fatal', first, rest);
  }

  // --- NestJS LoggerService (logs internes du framework) ---
  log(message: unknown, ...rest: unknown[]): void {
    this.record('info', message as LogFields | string, rest);
  }
  verbose(message: unknown, ...rest: unknown[]): void {
    this.record('trace', message as LogFields | string, rest);
  }

  /** Log unique de fin de requête HTTP (niveau déjà résolu par l'appelant). */
  logHttp(level: Level, fields: LogFields): void {
    this.logger[level](fields, 'http request completed');
  }

  private record(level: Level, first: LogFields | string, rest: unknown[]): void {
    if (first !== null && typeof first === 'object') {
      const message = typeof rest[0] === 'string' ? rest[0] : undefined;
      this.logger[level](first, message);
      return;
    }
    // Style NestJS : message + paramètres optionnels (contexte en dernier ; stack avant pour error).
    const message = typeof first === 'string' ? first : JSON.stringify(first);
    const meta: LogFields = {};
    const last = rest[rest.length - 1];
    if (typeof last === 'string') {
      meta.context = last;
    }
    if (level === 'error' && rest.length > 1 && typeof rest[0] === 'string') {
      meta.stack = rest[0];
    }
    this.logger[level](meta, message);
  }
}
