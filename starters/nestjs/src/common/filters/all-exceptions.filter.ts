import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { AppLogger } from '../logging/logging.service';

interface NormalizedError {
  message: string;
  errorCode?: string;
  details?: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  // Logger optionnel : absent dans les modules de test minimaux ; la réponse publique est inchangée.
  constructor(private readonly logger?: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const normalized = this.normalizeException(exception);

    // Log technique des 5xx uniquement (détail exploitable : type/code/stack sérialisés + requestId
    // injecté par le contexte). Les 4xx attendues ne sont pas re-loguées (le log HTTP de fin de
    // requête suffit) → pas de stack inutile, pas de double log d'accès.
    if (this.logger && status >= 500) {
      this.logger.error(
        { err: exception, statusCode: status, errorCode: normalized.errorCode },
        'unhandled server error',
      );
    }

    // Identifiant de corrélation (posé par le middleware request-id) — jamais une donnée de sécurité.
    const requestId = (request as Request & { requestId?: string }).requestId;

    // Enveloppe d'erreur à plat, contrat canonique ApiErrorResponse (Platform Contract, ADR-048).
    response.status(status).json({
      success: false,
      statusCode: status,
      message: normalized.message,
      errorCode: normalized.errorCode,
      details: normalized.details,
      path: request.url,
      timestamp: new Date().toISOString(),
      requestId,
    });
  }

  private normalizeException(exception: unknown): NormalizedError {
    if (!(exception instanceof HttpException)) {
      return {
        message: 'Internal server error.',
        errorCode: 'INTERNAL_SERVER_ERROR',
      };
    }

    const response = exception.getResponse();

    if (typeof response === 'string') {
      return {
        message: response,
      };
    }

    if (typeof response === 'object' && response !== null) {
      const payload = response as Record<string, unknown>;

      return {
        message: typeof payload.message === 'string' ? payload.message : 'Request failed.',
        errorCode: typeof payload.code === 'string' ? payload.code : undefined,
        details: payload.errors,
      };
    }

    return {
      message: 'Request failed.',
    };
  }
}
