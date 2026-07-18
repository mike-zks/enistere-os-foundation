import { ApiProperty } from '@nestjs/swagger';

/**
 * Enveloppe d'erreur PUBLIQUE (strategy/08_STANDARDS §30, produite par `AllExceptionsFilter`).
 * Schéma-only (Swagger) : jamais instancié au runtime. N'expose jamais de stack ni de détail
 * interne ; `errorCode` est un code applicatif stable (`error-codes.ts`).
 */
export class ApiErrorResponseDto {
  @ApiProperty({ example: false, description: 'Toujours false pour une réponse d’erreur.' })
  success!: false;

  @ApiProperty({ example: 404, description: 'Code de statut HTTP.' })
  statusCode!: number;

  @ApiProperty({ example: 'File not found.', description: 'Message générique non sensible.' })
  message!: string;

  @ApiProperty({ example: 'FILE_NOT_FOUND', description: 'Code d’erreur applicatif stable.' })
  errorCode!: string;

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Détails structurés optionnels (ex. erreurs de validation). Jamais de secret ni de stack.',
    example: null,
  })
  details?: unknown;

  @ApiProperty({ example: '/files/123', description: 'Chemin de la requête.' })
  path!: string;

  @ApiProperty({ format: 'date-time', example: '2026-06-09T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({
    required: false,
    description: 'Identifiant de corrélation de la requête (en-tête X-Request-Id). Pas une donnée de sécurité.',
    example: 'b3f1c2d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
  })
  requestId?: string;
}
