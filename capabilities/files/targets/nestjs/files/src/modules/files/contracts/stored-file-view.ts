import { FileCategory, FileStatus, FileVisibility } from '@prisma/client';

/**
 * Contrat INTERNE d'un fichier (orchestration, Upload 2). Inclut `storageKey`/`bucket`
 * — à ne jamais exposer publiquement. `size` est sérialisée en chaîne décimale (BigInt).
 */
export interface StoredFileView {
  id: string;
  ownerId: string | null;
  subjectId: string | null;
  originalName: string;
  storageKey: string;
  bucket: string;
  mimeType: string;
  extension: string;
  size: string;
  checksum: string | null;
  visibility: FileVisibility;
  status: FileStatus;
  category: FileCategory;
  createdAt: Date;
  updatedAt: Date;
}
