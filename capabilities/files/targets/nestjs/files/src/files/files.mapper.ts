import { StoredFile } from '@prisma/client';

import { PublicStoredFile } from './contracts/public-stored-file';
import { StoredFileView } from './contracts/stored-file-view';

/** Vue interne (inclut storageKey/bucket). `size` BigInt -> chaîne décimale. */
export function toStoredFileView(file: StoredFile): StoredFileView {
  return {
    id: file.id,
    ownerId: file.ownerId,
    subjectId: file.subjectId,
    originalName: file.originalName,
    storageKey: file.storageKey,
    bucket: file.bucket,
    mimeType: file.mimeType,
    extension: file.extension,
    size: file.size.toString(),
    checksum: file.checksum,
    visibility: file.visibility,
    status: file.status,
    category: file.category,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
  };
}

/** Contrat public (sans bucket/storageKey/ownerId/checksum/metadata). `size` en chaîne. */
export function toPublicStoredFile(file: StoredFile): PublicStoredFile {
  return {
    id: file.id,
    originalName: file.originalName,
    mimeType: file.mimeType,
    extension: file.extension,
    size: file.size.toString(),
    visibility: file.visibility,
    status: file.status,
    category: file.category,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
  };
}
