import { FILE_CATEGORIES, type FileCategory, type UploadCommand } from './files-models';

export const SUBJECT_ID_MAX_LENGTH = 128;

const MIME_PREFIXES: Readonly<Record<FileCategory, readonly string[]>> = {
  IMAGE: ['image/'],
  AVATAR: ['image/'],
  DOCUMENT: ['application/pdf', 'text/plain'],
  MEDIA: ['image/', 'audio/', 'video/'],
  VIDEO: ['video/'],
  AUDIO: ['audio/'],
  IDENTITY_DOCUMENT: ['application/pdf', 'image/'],
  ATTACHMENT: ['application/pdf', 'text/plain', 'image/', 'audio/', 'video/'],
  OTHER: ['application/', 'text/', 'image/', 'audio/', 'video/'],
};

export type UploadValidation =
  | { readonly valid: true; readonly command: UploadCommand }
  | { readonly valid: false; readonly reason: 'file' | 'category' | 'type' | 'subject' };

/** Browser-side shape check only; the authority still inspects bytes and decides. */
export function validateUpload(
  file: File | null,
  category: string,
  subjectId: string,
): UploadValidation {
  if (!file || file.size <= 0 || file.name.trim().length === 0) return { valid: false, reason: 'file' };
  if (!FILE_CATEGORIES.includes(category as FileCategory)) return { valid: false, reason: 'category' };
  if (subjectId.length > SUBJECT_ID_MAX_LENGTH) return { valid: false, reason: 'subject' };

  const selected = category as FileCategory;
  const declaredType = file.type.toLowerCase();
  if (!declaredType || !MIME_PREFIXES[selected].some((allowed) => (
    allowed.endsWith('/') ? declaredType.startsWith(allowed) : declaredType === allowed
  ))) return { valid: false, reason: 'type' };

  return {
    valid: true,
    command: { file, category: selected, ...(subjectId ? { subjectId } : {}) },
  };
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
