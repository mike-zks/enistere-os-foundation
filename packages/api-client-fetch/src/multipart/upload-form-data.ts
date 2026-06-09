/**
 * Routeur multipart unifié : accepte un `Blob`/`File` (Web/Node) OU un descripteur React Native, et
 * construit le `FormData` correspondant sans jamais forcer le `Content-Type`.
 */
import {
  createReactNativeUploadFormData,
  isReactNativeFileDescriptor,
  type ReactNativeFileDescriptor,
} from './react-native-form-data.js';
import { createWebUploadFormData, type FileCategory } from './web-form-data.js';

/** Partie fichier acceptée par l'upload. */
export type UploadFilePart = Blob | ReactNativeFileDescriptor;

export function buildUploadFormData(part: UploadFilePart, category: FileCategory, subjectId?: string): FormData {
  if (isReactNativeFileDescriptor(part)) {
    return createReactNativeUploadFormData(part, category, subjectId);
  }
  return createWebUploadFormData(part, category, subjectId);
}
