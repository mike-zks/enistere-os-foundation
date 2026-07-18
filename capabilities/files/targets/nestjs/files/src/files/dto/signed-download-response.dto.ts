import { ApiProperty } from '@nestjs/swagger';

/**
 * URL signée de lecture TEMPORAIRE. Exemple FICTIF (jamais de signature réelle). N'expose ni
 * bucket ni storageKey comme champs (l'URL présignée embarque la clé dans son chemin, par
 * conception S3 ; la valeur n'est jamais journalisée).
 */
export class SignedDownloadResponseDto {
  @ApiProperty({
    format: 'uri',
    example: 'https://storage.example.test/files/download?token=EXAMPLE-SIGNED-URL',
    description: 'URL temporaire signée (courte). Exemple fictif ; ne pas journaliser ni persister.',
  })
  url!: string;

  @ApiProperty({ format: 'date-time', example: '2026-06-09T12:05:00.000Z', description: 'Expiration de l’URL.' })
  expiresAt!: string;
}
