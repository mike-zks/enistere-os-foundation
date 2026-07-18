import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** Entrée interne de rejet d'un fichier (préparé pour Upload 2). */
export class RejectStoredFileInput {
  @IsUUID()
  fileId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(64)
  reasonCode!: string;
}
