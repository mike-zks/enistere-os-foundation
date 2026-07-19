import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { MulterError } from 'multer';

import { FILE_ERROR_CODES } from '../../common/errors/files-error-codes';

/**
 * Mappe les erreurs Multer (multipart) vers l'enveloppe d'erreur standard, sans exposer le
 * détail brut : dépassement de taille -> 413 `FILE_SIZE_EXCEEDED`, autres -> 400
 * `FILE_MULTIPART_INVALID`.
 */
@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const tooLarge = exception.code === 'LIMIT_FILE_SIZE';
    const statusCode = tooLarge ? HttpStatus.PAYLOAD_TOO_LARGE : HttpStatus.BAD_REQUEST;
    const errorCode = tooLarge ? FILE_ERROR_CODES.FILE_SIZE_EXCEEDED : FILE_ERROR_CODES.FILE_MULTIPART_INVALID;

    response.status(statusCode).json({
      success: false,
      statusCode,
      message: tooLarge ? 'File too large.' : 'Invalid multipart request.',
      errorCode,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
