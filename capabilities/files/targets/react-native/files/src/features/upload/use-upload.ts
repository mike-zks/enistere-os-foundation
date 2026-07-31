/**
 * useUploadMutation — secure multipart upload over the official client (RN 7).
 *
 * Wraps {@link useAuthedMutation} so the upload goes through the RN 4B 401 bridge
 * (`401 → AuthEngine.refreshSession() coalescée → 1 retry → purge`). The official
 * `apiClient.files.upload` POSTs `multipart/form-data` to API Core `POST /files`
 * (ADR-007 ; a FOUNDATION endpoint, NOT a business one), with the boundary set by
 * the runtime (never a forced `Content-Type`, ADR-016 §26).
 *
 * Refresh ownership: `retryOnAuthRefresh: false` — the client's own refresh stays
 * off (`enableRefresh: false`); our `authedRequest` owns the single 401 retry,
 * which re-invokes the upload → the FormData is REBUILT from `file` (never a
 * replayed/consumed stream).
 *
 * SECURITY (ADR-007/015): no file payload, signed URL, token or `Authorization`
 * header is ever placed in a query key, the (durable) query cache, logs, or the
 * local store. This is a MUTATION (no query key, transient result) and the upload
 * returns only the PUBLIC metadata DTO (no signed URL, no internal field). The
 * backend remains the authority for size/MIME/permission validation. Errors are
 * normalised for the UI with `toQueryError` (from `src/query`).
 */
import type { UseMutationResult } from '@tanstack/react-query';
import type { FileCategory } from '@enistere/api-client-fetch';

import { apiClient } from '../../features/auth/api-client';
import { useAuthedMutation, type AuthedMutationOptions } from '../../features/auth/use-authed-mutation';
import type { MobileFile } from './file';

/** Upload result — the PUBLIC file metadata DTO (no signed URL, no secret). */
export type UploadResult = Awaited<ReturnType<typeof apiClient.files.upload>>;

/** Variables for an upload mutation. The `file` is a transient input, never cached. */
export interface UploadVariables {
  readonly file: MobileFile;
  readonly category: FileCategory;
  /** Optional generic subject the file is attached to (no business meaning here). */
  readonly subjectId?: string;
}

/** Options pass-through (callbacks, etc.) — `mutationFn` is provided by this hook. */
export type UploadMutationOptions = Omit<
  AuthedMutationOptions<UploadResult, UploadVariables, unknown>,
  'mutationFn'
>;

export function useUploadMutation(
  options?: UploadMutationOptions,
): UseMutationResult<UploadResult, Error, UploadVariables> {
  return useAuthedMutation<UploadResult, UploadVariables>({
    ...options,
    mutationFn: ({ file, category, subjectId }) =>
      apiClient.files.upload(file, category, { subjectId, retryOnAuthRefresh: false }),
  });
}
