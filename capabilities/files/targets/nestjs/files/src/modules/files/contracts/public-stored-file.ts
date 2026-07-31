import { FileCategory, FileStatus, FileVisibility } from '@prisma/client';

/**
 * Contrat PUBLIC d'un fichier (réponse client). N'expose ni `bucket`, ni `storageKey`,
 * ni `ownerId`, ni `checksum`, ni `metadata` interne. `size` est une chaîne décimale.
 * Aucune URL de téléchargement en Upload 1 (URLs signées en Upload 2+).
 */
export interface PublicStoredFile {
  id: string;
  originalName: string;
  mimeType: string;
  extension: string;
  size: string;
  visibility: FileVisibility;
  status: FileStatus;
  category: FileCategory;
  createdAt: Date;
  updatedAt: Date;
}
