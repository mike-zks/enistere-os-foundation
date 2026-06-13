/**
 * Generic secure clipboard primitives (RN 23).
 *
 * A bounded text helper + a sensitivity classifier (reuses the RN 8 redaction),
 * an agnostic adapter contract (seam for `expo-clipboard`), an in-memory
 * placeholder adapter, and a best-effort, non-intrusive service that enforces a
 * security policy: it refuses to copy `sensitive` text without explicit opt-in,
 * reads only on an explicit call, and NEVER logs the clipboard content (metadata
 * only — length/sensitivity/result enums).
 *
 * GENERIC only — NO real `expo-clipboard`, NO network, NO persistence, NO UI, NO
 * automatic read at startup. The clipboard is a transient, shared, UNRELIABLE
 * channel and is NOT stored in preferences/Zustand/TanStack Query/SecureStore.
 * See ARCHITECTURE §32.
 */
export {
  isSensitiveClipboardText,
  classifyClipboardSensitivity,
  normalizeClipboardText,
  describeClipboardTextForLog,
  describeClipboardResultForLog,
  MAX_CLIPBOARD_TEXT_LENGTH,
} from './model';
export type {
  ClipboardSensitivity,
  ClipboardOperationResult,
  ClipboardCopyResult,
  SafeClipboardTextDescriptor,
  SafeClipboardResultDescriptor,
} from './model';

export { ClipboardAdapterError } from './adapter';
export type { ClipboardAdapter } from './adapter';

export { createPlaceholderClipboardAdapter } from './placeholder-adapter';
export type { PlaceholderClipboardAdapter } from './placeholder-adapter';

export { createClipboardService } from './service';
export type { ClipboardService, ClipboardServiceOptions, ClipboardCopyOptions } from './service';
