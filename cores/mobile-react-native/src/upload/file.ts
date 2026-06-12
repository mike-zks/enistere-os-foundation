/**
 * Generic React Native file descriptor + safe helpers (RN 7 — secure upload).
 *
 * {@link MobileFile} mirrors the official client's `ReactNativeFileDescriptor`
 * (`{ uri, name, type }`) — the file descriptor the RN runtime's `FormData`
 * accepts. It is defined HERE (not imported) so these helpers stay pure and
 * framework-agnostic (no `@enistere/*` import) and `node --test`-able; it is
 * structurally assignable to the package type, so it can be passed straight to
 * `apiClient.files.upload(...)`.
 *
 * SECURITY (ADR-007/015):
 * - The API Core is the AUTHORITY for upload validation (MIME, size, extension,
 *   permissions). Client checks below are UX hints ONLY — never a security
 *   boundary; the backend re-validates everything.
 * - NEVER log/store the raw descriptor: `uri` may be a device path
 *   (`file://`/`content://`). Use {@link describeFileForLog} (name + type only).
 * - The file is a MUTATION INPUT — never a query key, cached value, or secret.
 */

/** A React-Native file part: `{ uri, name, type }`. */
export interface MobileFile {
  readonly uri: string;
  readonly name: string;
  readonly type: string;
}

/** True when `value` is a structurally valid {@link MobileFile}. */
export function isMobileFile(value: unknown): value is MobileFile {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const file = value as Record<string, unknown>;
  return (
    typeof file.uri === 'string' &&
    file.uri.length > 0 &&
    typeof file.name === 'string' &&
    file.name.length > 0 &&
    typeof file.type === 'string' &&
    file.type.length > 0
  );
}

/** A SAFE descriptor for logs/UI — name + type ONLY, never the `uri`/payload. */
export interface SafeFileDescriptor {
  readonly name: string;
  readonly type: string;
}

/** Strips the `uri` (potential device path) — use this for any log/telemetry. */
export function describeFileForLog(file: MobileFile): SafeFileDescriptor {
  return { name: file.name, type: file.type };
}

/**
 * UX-ONLY pre-check that a file's MIME `type` is in `allowedTypes`. The backend
 * remains the authority (ADR-007) — this just lets the UI fail fast. Accepts an
 * exact match or a wildcard subtype (e.g. `image/*`). Empty `allowedTypes`
 * allows anything (defers entirely to the backend).
 */
export function isAllowedFileType(file: MobileFile, allowedTypes: readonly string[]): boolean {
  if (allowedTypes.length === 0) {
    return true;
  }
  const [group] = file.type.split('/');
  return allowedTypes.some(
    (allowed) => allowed === file.type || allowed === `${group}/*` || allowed === '*/*',
  );
}
