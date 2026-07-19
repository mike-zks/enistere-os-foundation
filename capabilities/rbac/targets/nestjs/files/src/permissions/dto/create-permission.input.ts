import { IsBoolean, IsOptional, IsString, MaxLength, Matches } from 'class-validator';

import { PERMISSION_CODE_PATTERN } from '../permissions.constants';

/**
 * Entrée interne de création de permission (DTO class-validator, ADR-003).
 * `resource` et `action` sont dérivés du `code` (`resource.action`).
 */
export class CreatePermissionInput {
  @IsString()
  @Matches(PERMISSION_CODE_PATTERN, { message: 'code must match resource.action (lowercase).' })
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
}
