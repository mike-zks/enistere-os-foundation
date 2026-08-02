export const FILE_CATEGORIES = [
  'IMAGE', 'DOCUMENT', 'AVATAR', 'MEDIA', 'VIDEO', 'AUDIO',
  'IDENTITY_DOCUMENT', 'ATTACHMENT', 'OTHER',
] as const;

export type FileCategory = typeof FILE_CATEGORIES[number];

/** Public, server-sanitized metadata. Storage coordinates never reach the client. */
export interface PublicStoredFile {
  readonly id: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly size: number;
  readonly category: FileCategory;
  readonly createdAt: string;
  readonly status?: string;
}

export interface FilePage {
  readonly items: readonly PublicStoredFile[];
  readonly nextOffset: number | null;
  readonly total: number;
}

export interface SignedDownload {
  readonly url: string;
  readonly expiresAt?: string;
  readonly expiresIn?: number;
}

export interface UploadCommand {
  readonly file: File;
  readonly category: FileCategory;
  readonly subjectId?: string;
}

export type PublicFilesErrorKind =
  | 'unauthorized' | 'forbidden' | 'notfound' | 'conflict'
  | 'too-large' | 'unsupported' | 'rate-limited' | 'unavailable' | 'error';

export interface PublicFilesError {
  readonly kind: PublicFilesErrorKind;
  readonly requestId: string | null;
}
