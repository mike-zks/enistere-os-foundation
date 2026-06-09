/**
 * Surface publique de `@enistere/api-client-fetch`.
 *
 * Client Fetch typé Enistere (au-dessus d'`openapi-fetch` + `@enistere/api-contracts`). Indépendant
 * de TanStack Query, React, React Native, Angular et Axios. Les hooks de server state (ADR-012) et
 * les implémentations de session (SecureStore/cookies) vivent dans les cores de plateforme.
 */
export {
  EnistereApiClient,
  createEnistereApiClient,
  defaultRequestIdFactory,
} from './client/enistere-api-client.js';
export type { EnistereApiClientOptions } from './client/enistere-api-client.js';
export type { UploadOptions } from './client/files-api.js';

export { ApiClientError, isApiErrorBody } from './errors/api-client-error.js';
export type { ApiClientErrorKind, ApiClientErrorInit } from './errors/api-client-error.js';

export type { AuthSessionAdapter } from './auth/auth-session-adapter.js';
export type { AuthTokens } from './auth/auth-types.js';
export { InMemorySessionAdapter } from './auth/in-memory-session-adapter.js';

export type { RequestIdFactory } from './request/request-id.js';

export {
  buildUploadFormData,
  type UploadFilePart,
} from './multipart/upload-form-data.js';
export { createWebUploadFormData, appendUploadMeta, type FileCategory } from './multipart/web-form-data.js';
export {
  createReactNativeUploadFormData,
  isReactNativeFileDescriptor,
  type ReactNativeFileDescriptor,
} from './multipart/react-native-form-data.js';
