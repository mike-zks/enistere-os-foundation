import { FileCategory, FileVisibility } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/**
 * Entrée interne de création d'une intention de fichier `PENDING` (DTO class-validator,
 * ADR-003). `size` est la taille DÉCLARÉE (octets) ; elle sera revalidée au contenu réel
 * en Upload 2. `originalName`/`mimeType`/`extension` sont normalisés et revérifiés par la
 * politique de validation.
 */
export class CreatePendingFileInput {
  @IsString()
  @MaxLength(1024)
  originalName!: string;

  @IsString()
  @MaxLength(255)
  mimeType!: string;

  @IsString()
  @MaxLength(12)
  extension!: string;

  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  size!: number;

  @IsEnum(FileCategory)
  category!: FileCategory;

  @IsOptional()
  @IsEnum(FileVisibility)
  visibility?: FileVisibility;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subjectId?: string;
}
