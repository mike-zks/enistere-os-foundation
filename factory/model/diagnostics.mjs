/**
 * Structured diagnostics shared by the canonical pipeline layers (ADR-045, ADR-046).
 *
 * A diagnostic is a machine-readable finding produced by one pipeline layer. It
 * never relies on free-text alone: every finding carries a stable, prefixed
 * `code` so callers react programmatically and the finding is localizable to its
 * layer. The shape is frozen:
 *
 *   { code, message, path?, severity, details?, source }
 *
 * - `code`     : stable identifier, prefixed by its layer (BLUEPRINT_/CSM_/RESOLUTION_/PLAN_).
 * - `message`  : human-readable explanation.
 * - `path`     : dotted location in the model.
 * - `severity` : `error` blocks; `warning` is advisory.
 * - `details`  : optional structured payload.
 * - `source`   : the layer that produced it (`blueprint`|`csm`|`resolution`|`plan`).
 */

/** Diagnostic severities, most severe last. */
export const DIAGNOSTIC_SEVERITIES = Object.freeze(['warning', 'error']);

/** Pipeline layers that emit diagnostics, each with its code prefix. */
export const DIAGNOSTIC_SOURCES = Object.freeze({
  blueprint: 'BLUEPRINT_',
  csm: 'CSM_',
  resolution: 'RESOLUTION_',
  plan: 'PLAN_',
});

/** Blueprint (input) diagnostic codes. */
export const BLUEPRINT_DIAGNOSTIC_CODES = Object.freeze({
  INVALID_INPUT: 'BLUEPRINT_INVALID_INPUT',
});

/** Canonical System Model diagnostic codes. */
export const CSM_DIAGNOSTIC_CODES = Object.freeze({
  EMPTY_SYSTEM_NAME: 'CSM_EMPTY_SYSTEM_NAME',
  INVALID_APPLICATION: 'CSM_INVALID_APPLICATION',
  DUPLICATE_APPLICATION_ID: 'CSM_DUPLICATE_APPLICATION_ID',
  UNSUPPORTED_RUNTIME: 'CSM_UNSUPPORTED_RUNTIME',
  INCOMPATIBLE_KIND_RUNTIME: 'CSM_INCOMPATIBLE_KIND_RUNTIME',
  INVALID_CAPABILITY_TARGET: 'CSM_INVALID_CAPABILITY_TARGET',
  INVALID_SYSTEM_PROFILE: 'CSM_INVALID_SYSTEM_PROFILE',
  INVALID_ARCHITECTURE_DIMENSION: 'CSM_INVALID_ARCHITECTURE_DIMENSION',
  MISSING_API: 'CSM_MISSING_API',
  TOPOLOGY_NOT_GENERATABLE: 'CSM_TOPOLOGY_NOT_GENERATABLE',
  INCOHERENT_STRUCTURE: 'CSM_INCOHERENT_STRUCTURE',
});

/** Resolution diagnostic codes. */
export const RESOLUTION_DIAGNOSTIC_CODES = Object.freeze({
  ARCHITECTURE_PROFILE_NOT_GENERATABLE: 'RESOLUTION_ARCHITECTURE_PROFILE_NOT_GENERATABLE',
  TOPOLOGY_NOT_GENERATABLE: 'RESOLUTION_TOPOLOGY_NOT_GENERATABLE',
  CAPABILITY_DEPENDENCY: 'RESOLUTION_CAPABILITY_DEPENDENCY',
  CAPABILITY_NOT_READY: 'RESOLUTION_CAPABILITY_NOT_READY',
  NO_VALID_TARGET: 'RESOLUTION_NO_VALID_TARGET',
  UNKNOWN_RUNTIME_ADAPTER: 'RESOLUTION_UNKNOWN_RUNTIME_ADAPTER',
});

/** Generation plan diagnostic codes. */
export const PLAN_DIAGNOSTIC_CODES = Object.freeze({
  BUNDLED_FEATURES_EXCEED_SELECTION: 'PLAN_BUNDLED_FEATURES_EXCEED_SELECTION',
});

const ALL_CODES = new Set([
  ...Object.values(BLUEPRINT_DIAGNOSTIC_CODES),
  ...Object.values(CSM_DIAGNOSTIC_CODES),
  ...Object.values(RESOLUTION_DIAGNOSTIC_CODES),
  ...Object.values(PLAN_DIAGNOSTIC_CODES),
]);

function sourceOf(code) {
  for (const [source, prefix] of Object.entries(DIAGNOSTIC_SOURCES)) if (code.startsWith(prefix)) return source;
  return null;
}

/**
 * Builds a frozen diagnostic. The `source` is derived from the code prefix.
 * `path` and `details` are omitted when absent so serialization stays stable.
 */
export function diagnostic(code, message, { path, severity = 'error', details } = {}) {
  if (!ALL_CODES.has(code)) throw new Error(`Unknown diagnostic code: ${code}`);
  if (!DIAGNOSTIC_SEVERITIES.includes(severity)) throw new Error(`Unknown diagnostic severity: ${severity}`);
  const source = sourceOf(code);
  const value = { code, message, severity, source };
  if (path !== undefined) value.path = path;
  if (details !== undefined) value.details = details;
  return Object.freeze(value);
}

/** True when any diagnostic is an `error`. */
export function hasErrors(diagnostics) {
  return diagnostics.some((item) => item.severity === 'error');
}

/** The `error` diagnostics only. */
export function errors(diagnostics) {
  return diagnostics.filter((item) => item.severity === 'error');
}

/** Formats diagnostics into a single deterministic human-readable block. */
export function formatDiagnostics(diagnostics) {
  return diagnostics
    .map((item) => `[${item.severity}] ${item.code}${item.path ? ` (${item.path})` : ''}: ${item.message}`)
    .join('\n');
}
