import { ApiProperty } from '@nestjs/swagger';

/** Réponse de `/health` (info générale, aucun détail sensible). */
export class HealthResponseDto {
  @ApiProperty({ enum: ['ok'], example: 'ok' })
  status!: string;

  @ApiProperty({ example: 'api-nestjs-core' })
  service!: string;

  @ApiProperty({ format: 'date-time', example: '2026-06-09T12:00:00.000Z' })
  timestamp!: string;
}

/** Réponse de `/health/live` (liveness, aucune dépendance externe). */
export class LivenessResponseDto {
  @ApiProperty({ enum: ['live'], example: 'live' })
  status!: string;
}

/** Réponse de `/health/ready` (readiness ; dépendances dures disponibles). */
export class ReadinessChecksDto {
  @ApiProperty({ enum: ['up'], example: 'up' })
  database!: string;
}

export class ReadinessResponseDto {
  @ApiProperty({ enum: ['ready'], example: 'ready' })
  status!: string;

  @ApiProperty({ type: ReadinessChecksDto })
  checks!: ReadinessChecksDto;
}
