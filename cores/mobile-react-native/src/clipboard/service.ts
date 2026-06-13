/**
 * Framework-agnostic secure clipboard service (RN 23 — clipboard).
 *
 * A **best-effort, non-intrusive** wrapper over a {@link ClipboardAdapter} that
 * enforces a security policy around the clipboard — a transient, shared,
 * UNRELIABLE channel. It NEVER throws and NEVER logs the clipboard CONTENT (only
 * metadata: length + sensitivity + result enums).
 *
 * Policy:
 * - `copy` REFUSES a `sensitive` text (RN 8 redaction would alter it, or the
 *   caller passed `markSensitive`) unless `allowSensitive: true` is set →
 *   `rejected`, and the adapter is NOT called. With opt-in it copies but still
 *   logs metadata only (the project SHOULD clear it afterwards).
 * - `getString` is opt-in via an explicit call — NEVER automatic. A sensitive
 *   value may be returned to the explicit caller but is NEVER logged.
 * - `clear` is a safe no-op when the adapter does not support it.
 *
 * Deliberately NOT provided (mission): no real `expo-clipboard`, no network, no
 * persistence, no UI, no automatic read at startup. The clipboard is NOT stored
 * in preferences/Zustand/TanStack Query/SecureStore.
 *
 * Logging (ADR-040 / RN 8): only `{ operation, result, sensitivity?, length? }`
 * — never the text.
 *
 * PURE / framework-agnostic (no React/RN import; no `Date.now()`) → `node --test`.
 */
import type { Logger } from '../logger/logger';
import { ClipboardAdapterError, type ClipboardAdapter } from './adapter';
import {
  classifyClipboardSensitivity,
  describeClipboardResultForLog,
  describeClipboardTextForLog,
  normalizeClipboardText,
  type ClipboardCopyResult,
  type ClipboardSensitivity,
} from './model';

export interface ClipboardCopyOptions {
  /** Allow copying a text classified `sensitive` (default `false` → rejected). */
  readonly allowSensitive?: boolean;
  /** Force the text to be treated as `sensitive` regardless of detection. */
  readonly markSensitive?: boolean;
}

export interface ClipboardService {
  /** Copy text; refuses sensitive text unless `allowSensitive`. Never throws. */
  copy(text: string, options?: ClipboardCopyOptions): Promise<ClipboardCopyResult>;
  /** Read the clipboard string (opt-in, explicit). `undefined` if empty/unavailable. */
  getString(): Promise<string | undefined>;
  /** Whether the clipboard currently holds a string (best-effort → `false`). */
  hasString(): Promise<boolean>;
  /** Clear the clipboard (safe no-op when unsupported). Never throws. */
  clear(): Promise<void>;
}

export interface ClipboardServiceOptions {
  readonly adapter: ClipboardAdapter;
  /** Optional RN 8 logger (metadata fields only — never the text). */
  readonly logger?: Logger;
}

/** Build a {@link ClipboardService} over an adapter (+ optional safe logger). */
export function createClipboardService(options: ClipboardServiceOptions): ClipboardService {
  const { adapter, logger } = options;

  return {
    copy: async (text, copyOptions) => {
      const normalized = normalizeClipboardText(text);
      const sensitivity: ClipboardSensitivity =
        copyOptions?.markSensitive === true ? 'sensitive' : classifyClipboardSensitivity(normalized);

      // Refuse sensitive content unless the caller explicitly opts in.
      if (sensitivity === 'sensitive' && copyOptions?.allowSensitive !== true) {
        logger?.warn('clipboard copy rejected', {
          operation: 'copy',
          ...describeClipboardResultForLog('rejected'),
          ...describeClipboardTextForLog(normalized, sensitivity),
        });
        return { result: 'rejected', sensitivity };
      }

      try {
        await adapter.setString(normalized);
        logger?.debug('clipboard copy', {
          operation: 'copy',
          ...describeClipboardResultForLog('success'),
          ...describeClipboardTextForLog(normalized, sensitivity),
        });
        return { result: 'success', sensitivity };
      } catch {
        logger?.warn('clipboard copy failed', {
          operation: new ClipboardAdapterError('setString').operation,
          ...describeClipboardResultForLog('error'),
          ...describeClipboardTextForLog(normalized, sensitivity),
        });
        return { result: 'error', sensitivity };
      }
    },

    getString: async () => {
      if (!adapter.getString) {
        logger?.debug('clipboard getString unavailable', {
          operation: 'getString',
          ...describeClipboardResultForLog('unavailable'),
        });
        return undefined;
      }
      try {
        const text = normalizeClipboardText(await adapter.getString());
        // NEVER log the content — only its metadata.
        logger?.debug('clipboard getString', {
          operation: 'getString',
          ...describeClipboardResultForLog('success'),
          ...describeClipboardTextForLog(text),
        });
        return text.length > 0 ? text : undefined;
      } catch {
        logger?.warn('clipboard getString failed', {
          operation: new ClipboardAdapterError('getString').operation,
          ...describeClipboardResultForLog('error'),
        });
        return undefined;
      }
    },

    hasString: async () => {
      if (!adapter.hasString) {
        return false;
      }
      try {
        return await adapter.hasString();
      } catch {
        logger?.warn('clipboard hasString failed', {
          operation: new ClipboardAdapterError('hasString').operation,
          ...describeClipboardResultForLog('error'),
        });
        return false;
      }
    },

    clear: async () => {
      if (!adapter.clear) {
        // Safe no-op when the platform cannot clear the clipboard.
        return;
      }
      try {
        await adapter.clear();
      } catch {
        logger?.warn('clipboard clear failed', {
          operation: new ClipboardAdapterError('clear').operation,
          ...describeClipboardResultForLog('error'),
        });
      }
    },
  };
}
