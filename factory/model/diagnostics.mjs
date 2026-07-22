/**
 * Structured diagnostics for the Canonical System Model (ADR-045).
 *
 * A diagnostic is a machine-readable finding produced while normalizing or
 * validating a system. It never relies on free-text alone: every finding carries
 * a stable `code`, so callers (CLI, future `plan`/`diff`, tests) can react
 * programmatically. The shape is frozen:
 *
 *   { code, message, path?, severity, details? }
 *
 * - `code`     : stable `CSM_*` identifier (see CSM_DIAGNOSTIC_CODES).
 * - `message`  : human-readable explanation.
 * - `path`     : dotted location in the model (e.g. `applications[1].runtime`).
 * - `severity` : `error` blocks the composition; `warning` is advisory.
 * - `details`  : optional structured payload (offending value, expected set…).
 */

/** Diagnostic severities, most severe last. */
export const DIAGNOSTIC_SEVERITIES = Object.freeze(['warning', 'error']);

/**
 * The closed set of CSM diagnostic codes. Adding a code here is the only way to
 * report a new class of finding — the tests assert every emitted code is known.
 */
export const CSM_DIAGNOSTIC_CODES = Object.freeze({
  EMPTY_SYSTEM_NAME: 'CSM_EMPTY_SYSTEM_NAME',
  INVALID_APPLICATION: 'CSM_INVALID_APPLICATION',
  DUPLICATE_APPLICATION_ID: 'CSM_DUPLICATE_APPLICATION_ID',
  UNSUPPORTED_RUNTIME: 'CSM_UNSUPPORTED_RUNTIME',
  INCOMPATIBLE_KIND_RUNTIME: 'CSM_INCOMPATIBLE_KIND_RUNTIME',
  INVALID_CAPABILITY_TARGET: 'CSM_INVALID_CAPABILITY_TARGET',
  UNSUPPORTED_ARCHITECTURE_STYLE: 'CSM_UNSUPPORTED_ARCHITECTURE_STYLE',
  MISSING_API: 'CSM_MISSING_API',
  INCOHERENT_STRUCTURE: 'CSM_INCOHERENT_STRUCTURE',
});

const KNOWN_CODES = new Set(Object.values(CSM_DIAGNOSTIC_CODES));

/**
 * Builds a frozen diagnostic. `severity` defaults to `error` (the common case for
 * a broken invariant); pass `warning` for advisory findings. `path` and `details`
 * are optional and omitted from the object when absent, so serialization stays
 * stable.
 */
export function diagnostic(code, message, { path, severity = 'error', details } = {}) {
  if (!KNOWN_CODES.has(code)) throw new Error(`Unknown CSM diagnostic code: ${code}`);
  if (!DIAGNOSTIC_SEVERITIES.includes(severity)) throw new Error(`Unknown diagnostic severity: ${severity}`);
  const value = { code, message, severity };
  if (path !== undefined) value.path = path;
  if (details !== undefined) value.details = details;
  return Object.freeze(value);
}

/** True when any diagnostic is an `error` (the composition must be refused). */
export function hasErrors(diagnostics) {
  return diagnostics.some((item) => item.severity === 'error');
}

/** The `error` diagnostics only. */
export function errors(diagnostics) {
  return diagnostics.filter((item) => item.severity === 'error');
}

/**
 * Formats diagnostics into a single human-readable block, most useful when
 * throwing. Deterministic: preserves input order and never adds timestamps.
 */
export function formatDiagnostics(diagnostics) {
  return diagnostics
    .map((item) => `[${item.severity}] ${item.code}${item.path ? ` (${item.path})` : ''}: ${item.message}`)
    .join('\n');
}
