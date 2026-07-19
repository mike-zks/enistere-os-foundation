import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const FILE_LIST_MAX_LIMIT = 50;
export const FILE_LIST_DEFAULT_LIMIT = 20;

export class FileListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(FILE_LIST_MAX_LIMIT)
  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    maximum: FILE_LIST_MAX_LIMIT,
    default: FILE_LIST_DEFAULT_LIMIT,
    example: FILE_LIST_DEFAULT_LIMIT,
    description: `Nombre de fichiers par page (1–${FILE_LIST_MAX_LIMIT}).`,
  })
  limit = FILE_LIST_DEFAULT_LIMIT;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({
    type: 'integer',
    minimum: 0,
    default: 0,
    example: 0,
    description: 'Position de départ (≥ 0).',
  })
  offset = 0;
}
