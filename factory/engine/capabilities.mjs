import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { STARTER_IDS } from './starters.mjs';

export const CAPABILITY_IDS = Object.freeze(['base', 'auth', 'rbac', 'files']);

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

export function validateCapabilityManifest(value) {
  const issues = [];
  if (value?.schemaVersion !== '2') issues.push('schemaVersion must be 2');
  if (!CAPABILITY_IDS.includes(value?.id)) issues.push('id is not registered');
  if (!/^\d+\.\d+\.\d+$/.test(value?.version ?? '')) issues.push('version must use SemVer');
  if (!Array.isArray(value?.requires)) issues.push('requires must be an array');
  if (!Array.isArray(value?.responsibilities) || value.responsibilities.length === 0) issues.push('responsibilities are required');
  for (const starterId of STARTER_IDS) {
    const target = value?.targets?.[starterId];
    if (!target || !STATUSES.has(target.status)) issues.push(`targets.${starterId}.status is invalid`);
    if (target?.status === 'ready' && !['built-in', 'overlay'].includes(target.mode)) issues.push(`targets.${starterId}.mode is required when ready`);
  }
  return issues;
}

export async function loadCapabilityManifests(repoRoot, selected = CAPABILITY_IDS) {
  const manifests = [];
  for (const id of selected) {
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
  if (!selected.includes('base')) issues.push('base is mandatory');
  if (selected.includes('auth') && !selected.includes('base')) issues.push('auth requires base');
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
