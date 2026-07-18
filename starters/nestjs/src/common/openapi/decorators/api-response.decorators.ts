import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

import { ApiErrorResponseDto } from '../dto/api-error-response.dto';

interface SuccessOptions {
  status?: number;
  description?: string;
}

/**
 * Documente l'enveloppe de succès `{ success, data, timestamp }` (ResponseInterceptor) avec un DTO
 * métier explicite dans `data`. Construit un schéma OpenAPI réel (pas de classe générique non
 * résolue par la réflexion Swagger).
 */
export function ApiSuccessResponse(dataDto: Type<unknown>, options: SuccessOptions = {}): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(dataDto),
    ApiResponse({
      status: options.status ?? 200,
      description: options.description,
      schema: {
        type: 'object',
        required: ['success', 'data', 'timestamp'],
        properties: {
          success: { type: 'boolean', example: true },
          data: { $ref: getSchemaPath(dataDto) },
          timestamp: { type: 'string', format: 'date-time', example: '2026-06-09T12:00:00.000Z' },
        },
      },
    }),
  );
}

/**
 * Enveloppe de succès SANS corps métier (`{ success, timestamp }`) — pour les handlers retournant
 * `void` (ex. quarantaine/restauration). `data` est volontairement absent.
 */
export function ApiSuccessNoDataResponse(options: SuccessOptions = {}): MethodDecorator {
  return ApiResponse({
    status: options.status ?? 200,
    description: options.description,
    schema: {
      type: 'object',
      required: ['success', 'timestamp'],
      properties: {
        success: { type: 'boolean', example: true },
        timestamp: { type: 'string', format: 'date-time', example: '2026-06-09T12:00:00.000Z' },
      },
    },
  });
}

/** Réponse `204 No Content` (aucun corps). */
export function ApiNoBodyResponse(description?: string): MethodDecorator {
  return ApiResponse({ status: 204, description });
}

/** Réponse d'erreur commune (`ApiErrorResponseDto`) pour un statut donné. */
export function ApiErrorResponse(status: number, description?: string): MethodDecorator {
  return ApiResponse({ status, description, type: ApiErrorResponseDto });
}
