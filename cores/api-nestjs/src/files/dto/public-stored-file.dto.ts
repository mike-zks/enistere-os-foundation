import { ApiProperty } from '@nestjs/swagger';

/**
 * Contrat PUBLIC d'un fichier. N'expose JAMAIS `bucket`, `storageKey`, `ownerId`, `checksum` ni
 * metadata interne. `size` est une chaîne décimale (BigInt). Enums fermées (V1).
 */
export class PublicStoredFileDto {
  @ApiProperty({ format: 'uuid', example: 'b3f1c2d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  id!: string;

  @ApiProperty({ example: 'photo.jpg', description: 'Métadonnée non fiable (UX uniquement).' })
  originalName!: string;

  @ApiProperty({ example: 'image/jpeg' })
  mimeType!: string;

  @ApiProperty({ example: 'jpg' })
  extension!: string;

  @ApiProperty({ type: 'string', pattern: '^[0-9]+$', example: '1048576', description: 'Taille en octets (chaîne décimale, BigInt).' })
  size!: string;

  @ApiProperty({ enum: ['PRIVATE', 'PUBLIC', 'SIGNED', 'INTERNAL'], example: 'PRIVATE' })
  visibility!: string;

  @ApiProperty({
    enum: ['PENDING', 'UPLOADED', 'VALIDATED', 'REJECTED', 'QUARANTINED', 'DELETED'],
    example: 'VALIDATED',
  })
  status!: string;

  @ApiProperty({
    enum: ['IMAGE', 'DOCUMENT', 'AVATAR', 'MEDIA', 'VIDEO', 'AUDIO', 'IDENTITY_DOCUMENT', 'ATTACHMENT', 'OTHER'],
    example: 'IMAGE',
  })
  category!: string;

  @ApiProperty({ format: 'date-time', example: '2026-06-09T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time', example: '2026-06-09T12:00:00.000Z' })
  updatedAt!: string;
}
