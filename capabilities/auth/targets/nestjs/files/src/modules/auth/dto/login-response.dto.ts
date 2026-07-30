import { ApiProperty } from '@nestjs/swagger';

import { UserProfileResponseDto } from './user-profile-response.dto';

/** Réponse de login (contenu de `data`). Tokens en exemples FICTIFS ; jamais de secret réel. */
export class LoginResponseDto {
  @ApiProperty({ type: UserProfileResponseDto })
  user!: UserProfileResponseDto;

  @ApiProperty({ example: 'eyJhbGciOiJI...EXAMPLE.access.token', description: 'Access token JWT court.' })
  accessToken!: string;

  @ApiProperty({ example: '8f3a...EXAMPLE.refresh.token', description: 'Refresh token opaque (rotation).' })
  refreshToken!: string;

  @ApiProperty({ example: 900, description: 'Durée de vie de l’access token (secondes).' })
  accessTokenExpiresIn!: number;

  @ApiProperty({ example: 1209600, description: 'Durée de vie du refresh token (secondes).' })
  refreshTokenExpiresIn!: number;

  @ApiProperty({ enum: ['Bearer'], example: 'Bearer' })
  tokenType!: string;
}
