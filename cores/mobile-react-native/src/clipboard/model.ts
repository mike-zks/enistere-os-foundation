/**
 * Secure clipboard model (RN 23 — clipboard).
 *
 * Generic primitives for a SECURE clipboard seam: a bounded text helper, a
 * sensitivity classifier (reusing the RN 8 central redaction), and tri-state
 * result/log descriptors. The foundation ships GENERIC primitives only: NO real
 * `expo-clipboard`, NO network, NO persistence, NO UI, NO automatic read at
 * startup (mission).
 *
 * SECURITY (ADR-040 §17/§18, ADR-015 §21/§24, 07_SECURITY) — the clipboard is a
 * transient, shared, UNRELIABLE channel. Its CONTENT is NEVER logged: only
 * metadata (length + sensitivity + result enums). A text the RN 8 redaction
 * would alter (Bearer/JWT/email/signed URL/device URI…) is classified
 * `sensitive`, and the service refuses to copy it unless the caller explicitly
 * opts in.
 *
 * Every helper TOLERATES invalid input (returns a safe default, never throws).
 * PURE / framework-agnostic (no React/RN/ESM import; no `Date.now()`) → unit-tested
 * under `node --test`.
 */
import { redactString } from '../logger/redaction';

/** Sensitivity classification of a clipboard text. */
export type ClipboardSensitivity = 'normal' | 'sensitive';

/**
 * Outcome of a clipboard operation.
 * - `success`     — the operation completed.
 * - `unavailable` — the adapter does not support the operation.
 * - `rejected`    — refused by policy (sensitive text without opt-in).
 * - `error`       — a controlled adapter failure (no raw cause exposed).
 */
export type ClipboardOperationResult = 'success' | 'unavailable' | 'rejected' | 'error';

/** Result of a copy attempt. */
export interface ClipboardCopyResult {
  readonly result: ClipboardOperationResult;
  readonly sensitivity: ClipboardSensitivity;
}

/** Safe log descriptor for a clipboard text — metadata ONLY (never content). */
export interface SafeClipboardTextDescriptor {
  readonly length: number;
  readonly sensitivity: ClipboardSensitivity;
}

/** Safe log descriptor for a result — enum ONLY. */
export interface SafeClipboardResultDescriptor {
  readonly result: ClipboardOperationResult;
}

/** Defensive bound on clipboard text length (diagnostics-safe, abuse-safe). */
export const MAX_CLIPBOARD_TEXT_LENGTH = 8192;

/** Coerce a raw value to a bounded string (non-string → `''`). Never throws. */
export function normalizeClipboardText(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.length > MAX_CLIPBOARD_TEXT_LENGTH
    ? value.slice(0, MAX_CLIPBOARD_TEXT_LENGTH)
    : value;
}

/**
 * True when a clipboard text looks sensitive: the RN 8 redaction would alter it
 * (Bearer/Basic credentials, JWTs, signed-URL params, device `file://`/
 * `content://` URIs, emails…). Heuristic — not a guarantee that other text is
 * safe (hence the explicit `markSensitive` opt-in on the service).
 */
export function isSensitiveClipboardText(text: string): boolean {
  return redactString(text) !== text;
}

/** Classify a (normalised) text as `normal` or `sensitive`. */
export function classifyClipboardSensitivity(text: string): ClipboardSensitivity {
  return isSensitiveClipboardText(text) ? 'sensitive' : 'normal';
}

/** Safe log view of a text — length + sensitivity ONLY (never the content). */
export function describeClipboardTextForLog(
  text: string,
  sensitivity: ClipboardSensitivity = classifyClipboardSensitivity(text),
): SafeClipboardTextDescriptor {
  return { length: text.length, sensitivity };
}

/** Safe log view of a result — enum ONLY. */
export function describeClipboardResultForLog(
  result: ClipboardOperationResult,
): SafeClipboardResultDescriptor {
  return { result };
}
