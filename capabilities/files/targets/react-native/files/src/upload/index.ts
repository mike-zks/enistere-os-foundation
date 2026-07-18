/**
 * Secure multipart upload primitives (RN 7).
 *
 * Generic file descriptor + an upload mutation over the official client and the
 * RN 4B/RN 5 auth/server-state layers. No business endpoint, no upload screen,
 * no file/token/signed-URL in any query key, durable cache, log or local store.
 * See ARCHITECTURE §16. Errors are normalised for the UI with `toQueryError`
 * (`src/query`).
 */
export {
  isMobileFile,
  describeFileForLog,
  isAllowedFileType,
} from './file';
export type { MobileFile, SafeFileDescriptor } from './file';

export { useUploadMutation } from './use-upload';
export type { UploadVariables, UploadResult, UploadMutationOptions } from './use-upload';
