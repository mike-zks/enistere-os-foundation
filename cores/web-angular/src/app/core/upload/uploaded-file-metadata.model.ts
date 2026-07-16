import type { FileCategory } from './file-category';

// Public metadata returned by the backend — never includes storageKey, bucket, signedUrl, or ownerId.
export interface UploadedFileMetadata {
  readonly id: string;
  readonly category: FileCategory;
}
