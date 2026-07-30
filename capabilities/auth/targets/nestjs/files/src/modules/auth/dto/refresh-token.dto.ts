import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// Borne de longueur : un refresh token légitime est court (~80 caractères).
const REFRESH_TOKEN_MAX_LENGTH = 512;

/**
 * DTO partagé par `/auth/refresh` et `/auth/logout`.
 * Le token n'est jamais journalisé ni exposé en exemple Swagger réel.
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token opaque délivré au login ou au refresh précédent.',
    maxLength: REFRESH_TOKEN_MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(REFRESH_TOKEN_MAX_LENGTH)
  refreshToken!: string;
}
