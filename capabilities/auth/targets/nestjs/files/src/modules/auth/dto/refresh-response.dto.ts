import { ApiProperty } from '@nestjs/swagger';

/** Réponse de refresh (nouvelle paire de tokens). Exemples FICTIFS ; jamais de secret réel. */
export class RefreshResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJI...EXAMPLE.access.token' })
  accessToken!: string;

  @ApiProperty({ example: '9c4b...EXAMPLE.refresh.token' })
  refreshToken!: string;

  @ApiProperty({ example: 900, description: 'Durée de vie de l’access token (secondes).' })
  accessTokenExpiresIn!: number;

  @ApiProperty({ example: 1209600, description: 'Durée de vie du refresh token (secondes).' })
  refreshTokenExpiresIn!: number;

  @ApiProperty({ enum: ['Bearer'], example: 'Bearer' })
  tokenType!: string;
}
