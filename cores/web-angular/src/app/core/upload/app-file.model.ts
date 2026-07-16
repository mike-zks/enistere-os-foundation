import type { FileCategory } from './file-category';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB — client-side UX guard; backend is authoritative

const ALLOWED_MIME_TYPES = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'audio/mpeg',
]);

export interface AppFile {
  readonly file: File;
  readonly category: FileCategory;
  readonly subjectId?: string;
}

export function isValidAppFile(file: File): boolean {
  return file.size > 0 && file.size <= MAX_FILE_SIZE_BYTES;
}

export function isAllowedFileType(file: File): boolean {
  if (!file.type) return true; // unknown MIME — let backend decide
  return ALLOWED_MIME_TYPES.has(file.type);
}

// Safe descriptor for logging — extension and size only, never filename/path/content/token.
export function describeFileForLog(file: File): { extension: string; sizeBytes: number } {
  const lastDot = file.name.lastIndexOf('.');
  const extension = lastDot >= 0 ? file.name.slice(lastDot + 1).toLowerCase() : '';
  return { extension, sizeBytes: file.size };
}
