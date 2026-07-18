/**
 * Clipboard adapter contract (RN 23 — clipboard).
 *
 * The seam between the agnostic {@link ClipboardService} and the platform source
 * (a future `expo-clipboard` wrapper: `setStringAsync`/`getStringAsync`/
 * `hasStringAsync`). The foundation ships only the contract + an in-memory
 * placeholder — NO real `expo-clipboard`, NO native module, NO persistence
 * (mission). A derived project wires a real adapter.
 *
 * Operations are async (the native clipboard APIs are async). `getString`/
 * `hasString`/`clear` are OPTIONAL — a platform may not support reading or
 * clearing; the service degrades gracefully (`unavailable` / safe no-op).
 *
 * Agnostic (no React/RN import) → `node --test`-able.
 */
export interface ClipboardAdapter {
  /** Write a string to the clipboard. */
  setString(text: string): Promise<void>;
  /** Read the current clipboard string (optional). */
  getString?(): Promise<string>;
  /** Whether the clipboard currently holds a string (optional). */
  hasString?(): Promise<boolean>;
  /** Clear the clipboard (optional). */
  clear?(): Promise<void>;
}

/**
 * Controlled error for a failed adapter operation. Carries only the safe
 * `operation` — NEVER the clipboard text or an underlying cause.
 */
export class ClipboardAdapterError extends Error {
  readonly operation: 'setString' | 'getString' | 'hasString' | 'clear';

  constructor(operation: 'setString' | 'getString' | 'hasString' | 'clear') {
    super(`Clipboard adapter "${operation}" failed.`);
    this.name = 'ClipboardAdapterError';
    this.operation = operation;
  }
}
