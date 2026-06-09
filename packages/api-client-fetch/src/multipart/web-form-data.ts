/**
 * Multipart Web — `FormData` natif. Ne définit JAMAIS le `Content-Type` (boundary posé par le runtime).
 * `FileCategory` est dérivée du contrat généré.
 */
import type { SchemaOf } from '@enistere/api-contracts';

/** Enum fermée des catégories, dérivée du contrat (jamais ré-écrite). */
export type FileCategory = SchemaOf<'PublicStoredFileDto'>['category'];

/** Ajoute les métadonnées d'upload communes (utilisé aussi par le helper React Native). */
export function appendUploadMeta(form: FormData, category: FileCategory, subjectId?: string): void {
  form.append('category', category);
  if (subjectId !== undefined) {
    form.append('subjectId', subjectId);
  }
}

/** Construit le `FormData` d'upload Web à partir d'un `Blob`/`File`. */
export function createWebUploadFormData(file: Blob, category: FileCategory, subjectId?: string): FormData {
  const form = new FormData();
  form.append('file', file);
  appendUploadMeta(form, category, subjectId);
  return form;
}
