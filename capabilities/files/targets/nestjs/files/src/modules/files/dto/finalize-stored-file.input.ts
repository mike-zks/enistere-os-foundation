import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

/**
 * Entrée interne de finalisation d'un fichier après stockage effectif (préparé pour
 * Upload 2). Le contenu n'est pas traité en Upload 1.
 */
export class FinalizeStoredFileInput {
  @IsUUID()
  fileId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  checksum?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  size?: number;
}
