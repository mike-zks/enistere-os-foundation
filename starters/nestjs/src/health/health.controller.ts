import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../auth/decorators/public.decorator';
import { ERROR_CODES } from '../common/errors/error-codes';
import {
  ApiErrorResponse,
  ApiSuccessResponse,
} from '../common/openapi/decorators/api-response.decorators';
import { PrismaService } from '../database/prisma.service';
import {
  HealthResponseDto,
  LivenessResponseDto,
  ReadinessResponseDto,
} from './dto/health-response.dto';

interface HealthResponse {
  status: 'ok';
  service: string;
  timestamp: string;
}

interface LivenessResponse {
  status: 'live';
}

interface ReadinessResponse {
  status: 'ready';
  checks: { database: 'up' };
}

/**
 * Sondes de santé (publiques). Séparation **liveness / readiness** :
 * - `live` ne dépend d'aucun service externe (le processus répond) ;
 * - `ready` vérifie les dépendances dures (PostgreSQL) avant de recevoir du trafic.
 *
 * Le stockage S3/MinIO n'entre PAS dans la readiness en V1 : une panne S3 ne doit pas retirer
 * toute l'API du service (les lectures de métadonnées et l'auth restent disponibles ; seuls
 * l'upload/download échouent, de façon gérée). Aucun détail sensible (host/port/endpoint/
 * credentials/version interne) n'est exposé.
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  @ApiOperation({ operationId: 'health_get', summary: 'Statut applicatif général.' })
  @ApiSuccessResponse(HealthResponseDto, { description: 'Statut applicatif général.' })
  getHealth(): HealthResponse {
    return { status: 'ok', service: 'api-nestjs-core', timestamp: new Date().toISOString() };
  }

  @Get('live')
  @Public()
  @ApiOperation({ operationId: 'health_live', summary: 'Liveness : le processus répond (aucune dépendance externe).' })
  @ApiSuccessResponse(LivenessResponseDto, { description: 'Le processus répond.' })
  getLiveness(): LivenessResponse {
    return { status: 'live' };
  }

  @Get('ready')
  @Public()
  @ApiOperation({ operationId: 'health_ready', summary: 'Readiness : dépendances dures disponibles (PostgreSQL).' })
  @ApiSuccessResponse(ReadinessResponseDto, { description: 'Dépendances dures disponibles.' })
  @ApiErrorResponse(503, 'Une dépendance dure est indisponible (réponse générique).')
  async getReadiness(): Promise<ReadinessResponse> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      // Réponse publique minimale (503 générique) ; le détail technique reste côté logs internes.
      throw new ServiceUnavailableException({
        code: ERROR_CODES.SERVICE_UNAVAILABLE,
        message: 'Service is not ready.',
      });
    }
    return { status: 'ready', checks: { database: 'up' } };
  }
}
