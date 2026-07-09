import { ApiProperty } from '@nestjs/swagger';

import { PublicStoredFile } from '../contracts/public-stored-file';
import { PublicStoredFileDto } from './public-stored-file.dto';

export class FileListResponseDto {
  @ApiProperty({ type: () => [PublicStoredFileDto], description: 'Fichiers de la page courante.' })
  items!: PublicStoredFile[];

  @ApiProperty({ type: 'integer', example: 20, description: 'Limite appliquée.' })
  limit!: number;

  @ApiProperty({ type: 'integer', example: 0, description: 'Offset appliqué.' })
  offset!: number;

  @ApiProperty({
    type: 'integer',
    example: 20,
    nullable: true,
    description: 'Offset de la page suivante, null si dernière page.',
  })
  nextOffset!: number | null;
}
