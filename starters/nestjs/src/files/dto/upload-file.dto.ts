import { ApiProperty } from '@nestjs/swagger';
import { FileCategory } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Champs textuels du formulaire multipart. Le binaire (`file`) est validé séparément
 * (signatures, taille réelle) ; aucune confiance dans le MIME/extension déclarés.
 */
export class UploadFileDto {
  @ApiProperty({ enum: FileCategory, description: 'Catégorie générique du fichier.' })
  @IsEnum(FileCategory)
  category!: FileCategory;

  @ApiProperty({ required: false, maxLength: 255, description: 'Rattachement métier générique optionnel.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subjectId?: string;
}
