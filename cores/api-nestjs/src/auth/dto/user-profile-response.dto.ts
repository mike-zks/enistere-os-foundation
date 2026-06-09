import { ApiProperty } from '@nestjs/swagger';

/** Profil public d'un utilisateur (jamais `passwordHash` ni modèle Prisma). */
export class UserProfileResponseDto {
  @ApiProperty({ format: 'uuid', example: 'b3f1c2d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  id!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], example: 'ACTIVE' })
  status!: string;

  @ApiProperty({ format: 'date-time', example: '2026-06-09T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time', example: '2026-06-09T12:00:00.000Z' })
  updatedAt!: string;

  @ApiProperty({ format: 'date-time', nullable: true, required: false, example: null })
  deactivatedAt!: string | null;
}
