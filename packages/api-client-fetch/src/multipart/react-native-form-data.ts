/**
 * Multipart React Native — un descripteur `{uri,name,type}` est une partie fichier valide à la runtime
 * RN. Aucune dépendance React Native/Expo ; aucun `Content-Type` forcé ; assertion de type CENTRALISÉE.
 *
 * Différence d'environnement : le `FormData` de Node (undici, strict WHATWG) refuse ce descripteur ;
 * la runtime React Native l'accepte. Ce n'est pas un défaut du contrat ni d'openapi-fetch.
 */
import { appendUploadMeta, type FileCategory } from './web-form-data.js';

export interface ReactNativeFileDescriptor {
  uri: string;
  name: string;
  type: string;
}

export function isReactNativeFileDescriptor(part: unknown): part is ReactNativeFileDescriptor {
  if (typeof part !== 'object' || part === null) {
    return false;
  }
  const candidate = part as Record<string, unknown>;
  return (
    typeof candidate['uri'] === 'string' &&
    typeof candidate['name'] === 'string' &&
    typeof candidate['type'] === 'string'
  );
}

export function createReactNativeUploadFormData(
  file: ReactNativeFileDescriptor,
  category: FileCategory,
  subjectId?: string,
): FormData {
  const form = new FormData();
  // RN : le descripteur EST une partie fichier valide. Les types Web/Node attendent `Blob|string` →
  // UNE assertion, centralisée ici (jamais dans le code généré), documentée.
  form.append('file', file as unknown as Blob, file.name);
  appendUploadMeta(form, category, subjectId);
  return form;
}
