import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { STARTER_IDS } from './starters.mjs';

export const CAPABILITY_IDS = Object.freeze(['auth', 'rbac', 'files']);

/**
 * Support status of a capability on a target, with explicit semantics:
 *
 * - `ready`          : composable today (see `mode`: built-in or overlay).
 * - `planned`        : intended but not delivered — **blocks** generation.
 * - `unsupported`    : will not be delivered for this target — **blocks** generation.
 * - `not-applicable` : the capability has no surface on this target by design and
 *                      the target consumes it from another one (e.g. RBAC is a
 *                      server-side authorization concern: a mobile app receives
 *                      decisions from the API and owns no RBAC surface). It does
 *                      **not** block generation and injects nothing.
 */
export const CAPABILITY_STATUSES = Object.freeze(['ready', 'planned', 'unsupported', 'not-applicable']);
/** Statuses that do not prevent composing a selection on a target. */
export const NON_BLOCKING_STATUSES = Object.freeze(['ready', 'not-applicable']);
const STATUSES = new Set(CAPABILITY_STATUSES);

// Capability Contract v2 (factory/schema/capability.schema.json). The manifest is
// a CLOSED contract: unknown properties are rejected. The rich fields (conflicts,
// provides, configuration, compatibility, migrations) are OPTIONAL but part of the
// frozen v2 shape, so filling them later is a field-fill — never a schema break.
const SEMVER = /^\d+\.\d+\.\d+$/;
const RUNTIME_IDS = new Set(STARTER_IDS);
const CONFIG_TYPES = new Set(['enum', 'string', 'boolean', 'integer']);
const KNOWN_KEYS = new Set([
  'schemaVersion', 'id', 'version', 'requires', 'responsibilities', 'targets',
  'conflicts', 'provides', 'configuration', 'compatibility', 'migrations',
]);
const TARGET_KEYS = new Set(['status', 'mode']);

export function validateCapabilityManifest(value) {
  const issues = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ['capability manifest must be an object'];
  for (const key of Object.keys(value)) if (!KNOWN_KEYS.has(key)) issues.push(`unknown property: ${key}`);
  if (value.schemaVersion !== '2') issues.push('schemaVersion must be 2');
  if (!CAPABILITY_IDS.includes(value.id)) issues.push('id is not registered');
  if (!SEMVER.test(value.version ?? '')) issues.push('version must use SemVer');
  if (!Array.isArray(value.requires)) issues.push('requires must be an array');
  else if (value.requires.some((item) => typeof item !== 'string' || item === '')) issues.push('requires must contain capability ids');
  if (!Array.isArray(value.responsibilities) || value.responsibilities.length === 0) issues.push('responsibilities are required');

  if (!value.targets || typeof value.targets !== 'object' || Array.isArray(value.targets)) issues.push('targets must be an object');
  else for (const starterId of STARTER_IDS) {
    const target = value.targets[starterId];
    if (!target || typeof target !== 'object' || Array.isArray(target)) { issues.push(`targets.${starterId} is required`); continue; }
    for (const key of Object.keys(target)) if (!TARGET_KEYS.has(key)) issues.push(`targets.${starterId}.${key} is not a known field`);
    if (!STATUSES.has(target.status)) issues.push(`targets.${starterId}.status is invalid`);
    if (target.status === 'ready' && !['built-in', 'overlay'].includes(target.mode)) issues.push(`targets.${starterId}.mode is required when ready`);
    if (target.status !== 'ready' && target.mode !== undefined) issues.push(`targets.${starterId}.mode is only allowed when ready`);
  }

  issues.push(...validateOptionalCapabilityFields(value));
  return issues;
}

/** Validates the optional v2 fields when present (strict-when-present). */
function validateOptionalCapabilityFields(value) {
  const issues = [];
  if (value.conflicts !== undefined) {
    if (!Array.isArray(value.conflicts) || value.conflicts.some((item) => typeof item !== 'string' || item === '')) issues.push('conflicts must be an array of capability ids');
    else if (new Set(value.conflicts).size !== value.conflicts.length) issues.push('conflicts must be unique');
  }
  if (value.provides !== undefined) {
    if (!value.provides || typeof value.provides !== 'object' || Array.isArray(value.provides)) issues.push('provides must be an object');
    else {
      for (const key of Object.keys(value.provides)) if (key !== 'contracts') issues.push(`provides.${key} is not supported`);
      const contracts = value.provides.contracts;
      if (contracts !== undefined && (!Array.isArray(contracts) || contracts.some((item) => typeof item !== 'string' || item === ''))) issues.push('provides.contracts must be an array of names');
    }
  }
  if (value.configuration !== undefined) {
    if (!value.configuration || typeof value.configuration !== 'object' || Array.isArray(value.configuration)) issues.push('configuration must be an object');
    else for (const [name, spec] of Object.entries(value.configuration)) {
      if (!spec || typeof spec !== 'object' || Array.isArray(spec)) { issues.push(`configuration.${name} must be an object`); continue; }
      for (const key of Object.keys(spec)) if (!['type', 'values', 'default'].includes(key)) issues.push(`configuration.${name}.${key} is not supported`);
      if (!CONFIG_TYPES.has(spec.type)) issues.push(`configuration.${name}.type is invalid`);
      if (spec.type === 'enum') {
        if (!Array.isArray(spec.values) || spec.values.length === 0 || spec.values.some((item) => typeof item !== 'string' || item === '')) issues.push(`configuration.${name}.values is required for enum`);
        else if (new Set(spec.values).size !== spec.values.length) issues.push(`configuration.${name}.values must be unique`);
        else if (spec.default !== undefined && !spec.values.includes(spec.default)) issues.push(`configuration.${name}.default must be one of values`);
      } else if (spec.values !== undefined) issues.push(`configuration.${name}.values is only allowed for enum`);
    }
  }
  if (value.compatibility !== undefined) {
    if (!value.compatibility || typeof value.compatibility !== 'object' || Array.isArray(value.compatibility)) issues.push('compatibility must be an object');
    else {
      for (const key of Object.keys(value.compatibility)) if (key !== 'runtimes') issues.push(`compatibility.${key} is not supported`);
      const runtimes = value.compatibility.runtimes;
      if (runtimes !== undefined) {
        if (!runtimes || typeof runtimes !== 'object' || Array.isArray(runtimes)) issues.push('compatibility.runtimes must be an object');
        else for (const [runtimeId, range] of Object.entries(runtimes)) {
          if (!RUNTIME_IDS.has(runtimeId)) issues.push(`compatibility.runtimes.${runtimeId} is not a known runtime`);
          if (typeof range !== 'string' || range === '') issues.push(`compatibility.runtimes.${runtimeId} must be a version range`);
        }
      }
    }
  }
  if (value.migrations !== undefined) {
    if (!value.migrations || typeof value.migrations !== 'object' || Array.isArray(value.migrations)) issues.push('migrations must be an object');
    else {
      for (const key of Object.keys(value.migrations)) if (key !== 'from') issues.push(`migrations.${key} is not supported`);
      const from = value.migrations.from;
      if (from !== undefined) {
        if (!Array.isArray(from) || from.some((item) => !SEMVER.test(item ?? ''))) issues.push('migrations.from must be an array of SemVer versions');
        else if (new Set(from).size !== from.length) issues.push('migrations.from must be unique');
      }
    }
  }
  return issues;
}

export async function loadCapabilityManifests(repoRoot, selected = CAPABILITY_IDS) {
  const manifests = [];
  // `base` is accepted only as legacy Blueprint v1 input. It is erased before
  // registry resolution because the Platform Baseline is not a capability.
  for (const id of selected.filter((candidate) => candidate !== 'base')) {
    if (!CAPABILITY_IDS.includes(id)) throw new Error(`Unknown capability manifest: ${id}`);
    const value = JSON.parse(await readFile(join(repoRoot, 'capabilities', id, 'capability.json'), 'utf8'));
    const issues = validateCapabilityManifest(value);
    if (issues.length) throw new Error(`${id} capability manifest invalid:\n- ${issues.join('\n- ')}`);
    manifests.push(value);
  }
  return manifests;
}

export function validateCapabilityDependencies(selected) {
  const issues = [];
  if (selected.includes('rbac') && !selected.includes('auth')) issues.push('rbac requires auth');
  if (selected.includes('files') && !selected.includes('auth')) issues.push('files requires auth');
  if (selected.includes('files') && !selected.includes('rbac')) issues.push('files requires rbac');
  return [...new Set(issues)];
}

/**
 * A selection is composable when every selected capability is, on every selected
 * target, either `ready` or `not-applicable`. `not-applicable` targets are
 * reported separately: they compose nothing and must never receive a surface.
 */
export function assessCapabilitySupport(starterIds, manifests) {
  const blockers = [];
  const notApplicable = [];
  for (const manifest of manifests) {
    for (const starterId of starterIds) {
      const target = manifest.targets[starterId];
      if (target.status === 'not-applicable') {
        notApplicable.push({ capability: manifest.id, starter: starterId });
      } else if (!NON_BLOCKING_STATUSES.includes(target.status)) {
        blockers.push({ capability: manifest.id, starter: starterId, status: target.status });
      }
    }
  }
  return { ready: blockers.length === 0, blockers, notApplicable };
}

export function buildCapabilityMatrix(manifests) {
  return Object.fromEntries(manifests.map((manifest) => [
    manifest.id,
    Object.fromEntries(STARTER_IDS.map((starterId) => [starterId, manifest.targets[starterId].status])),
  ]));
}
