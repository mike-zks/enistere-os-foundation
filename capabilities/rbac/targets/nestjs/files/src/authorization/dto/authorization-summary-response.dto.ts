import { ApiProperty } from '@nestjs/swagger';

/**
 * Résumé d'autorisation pour l'UI conditionnelle (ADR-006). Codes triés/dédupliqués ; ce n'est PAS
 * une preuve d'autorisation réutilisable — l'API reste l'autorité à chaque requête.
 */
export class AuthorizationSummaryResponseDto {
  @ApiProperty({ type: [String], example: ['administrator'] })
  roles!: string[];

  @ApiProperty({ type: [String], example: ['files.read', 'files.upload'] })
  permissions!: string[];
}
