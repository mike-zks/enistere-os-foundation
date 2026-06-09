import { ApiProperty } from '@nestjs/swagger';

/** Réponse de logout (idempotente). */
export class LogoutResponseDto {
  @ApiProperty({ enum: ['logged_out'], example: 'logged_out' })
  status!: string;
}
