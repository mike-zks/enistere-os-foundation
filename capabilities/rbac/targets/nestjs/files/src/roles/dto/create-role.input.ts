import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Entrée interne de création de rôle (DTO class-validator, ADR-003). */
export class CreateRoleInput {
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  code!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(128)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
}
