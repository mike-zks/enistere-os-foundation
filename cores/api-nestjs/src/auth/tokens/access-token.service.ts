import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AccessTokenClaims } from '../contracts/access-token-claims';

/**
 * Signature des access tokens JWT courts.
 *
 * Le secret et la durée (`expiresIn`) sont configurés au niveau du `JwtModule`
 * (depuis la configuration validée). Ce service ne fait que signer des claims
 * minimaux et typés.
 */
@Injectable()
export class AccessTokenService {
  constructor(private readonly jwtService: JwtService) {}

  sign(claims: AccessTokenClaims): Promise<string> {
    return this.jwtService.signAsync(claims);
  }
}
