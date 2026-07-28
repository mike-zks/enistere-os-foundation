import { readFile, readdir } from 'node:fs/promises';
import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STARTER_IDS } from './starters.mjs';
import { getTargetAdapter } from './target-adapters.mjs';
import { validateManifestSchema } from './capability-schema.mjs';

const FOUNDATION_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CAPABILITIES_ROOT = join(FOUNDATION_ROOT, 'capabilities');

/**
 * The local registry is directory-driven: adding a capability never requires an
 * engine edit. IDs are sorted so validation, closure and materialization remain
 * deterministic on every filesystem.
 */
export const CAPABILITY_IDS = Object.freeze(readdirSync(CAPABILITIES_ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort());

// The enums below are read from the normative schema (ADR-072): redeclaring
// them here would recreate the very duplication this module used to carry.
export {
  CAPABILITY_STATUSES,
  INFRASTRUCTURE_PRIMITIVE_KINDS,
  CAPABILITY_DEPLOYMENT_MODES,
} from './capability-schema.mjs';
export const NON_BLOCKING_STATUSES = Object.freeze(['ready', 'not-applicable']);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validateUniqueStrings(value, path, { required = true } = {}) {
  if (!Array.isArray(value)) return [`${path} must be an array`];
  const issues = [];
  if (required && value.length === 0) issues.push(`${path} must not be empty`);
  if (value.some((item) => typeof item !== 'string' || item === '')) {
    issues.push(`${path} must contain non-empty strings`);
  }
  if (new Set(value).size !== value.length) issues.push(`${path} must be unique`);
  return issues;
}

function uniqueById(items, label) {
  if (!Array.isArray(items)) return [];
  const ids = items.filter(isObject).map((item) => item.id);
  return new Set(ids).size === ids.length ? [] : [`${label} must have unique ids`];
}

/**
 * Everything a JSON Schema cannot express: identifiers referencing OTHER parts
 * of the same document. Shape, enums, patterns and the ready-target contract are
 * the schema's job (ADR-072); reporting them here again would be the dual-truth
 * defect this split removed. Malformed shapes are skipped, not re-reported.
 */
function validateCrossReferences(manifest) {
  const issues = [];

  issues.push(...uniqueById(manifest.conflicts, 'conflicts'));
  issues.push(...uniqueById(manifest.contracts, 'contracts'));
  issues.push(...uniqueById(manifest.primitives, 'primitives'));
  issues.push(...uniqueById(manifest.migrations, 'migrations'));
  issues.push(...uniqueById(manifest.conformance, 'conformance'));

  for (const [index, migration] of (manifest.migrations ?? []).entries()) {
    if (!isObject(migration) || typeof migration.path !== 'string') continue;
    if (!migration.path.startsWith(`targets/${migration.target}/`)) {
      issues.push(`migrations[${index}].path must belong to target ${migration.target}`);
    }
  }

  for (const [name, spec] of Object.entries(manifest.configuration ?? {})) {
    if (!isObject(spec)) continue;
    if (spec.type === 'enum' && spec.default !== undefined && !spec.values?.includes(spec.default)) {
      issues.push(`configuration.${name}.default must be one of values`);
    }
  }

  const responsibilityIds = new Set(manifest.responsibilities ?? []);
  const declared = {
    contracts: new Set((manifest.contracts ?? []).map((item) => item?.id)),
    primitives: new Set((manifest.primitives ?? []).map((item) => item?.id)),
    migrations: new Set((manifest.migrations ?? []).map((item) => item?.id)),
    conformance: new Set((manifest.conformance ?? []).map((item) => item?.id)),
  };

  for (const [runtimeId, target] of Object.entries(manifest.targets ?? {})) {
    if (!isObject(target) || target.status !== 'ready') continue;

    if (isObject(target.adapter) && target.adapter.id !== runtimeId) {
      issues.push(`targets.${runtimeId}.adapter.id must be ${runtimeId}`);
    }
    for (const responsibility of target.responsibilities ?? []) {
      if (!responsibilityIds.has(responsibility)) {
        issues.push(`targets.${runtimeId}.responsibilities references unknown ${responsibility}`);
      }
    }
    for (const [field, known] of Object.entries(declared)) {
      for (const id of target[field] ?? []) {
        if (!known.has(id)) issues.push(`targets.${runtimeId}.${field} references unknown ${id}`);
      }
    }
    for (const migrationId of target.migrations ?? []) {
      const migration = (manifest.migrations ?? []).find((item) => item?.id === migrationId);
      if (migration && migration.target !== runtimeId) {
        issues.push(`targets.${runtimeId}.migrations references migration ${migrationId} owned by ${migration.target}`);
      }
    }
    for (const suiteId of target.conformance ?? []) {
      const suite = (manifest.conformance ?? []).find((item) => item?.id === suiteId);
      if (suite && suite.target !== runtimeId) {
        issues.push(`targets.${runtimeId}.conformance references suite ${suiteId} owned by ${suite.target}`);
      }
    }
  }
  return issues;
}

/**
 * Validates the closed Capability Manifest v2 contract: the normative schema
 * first, then the cross-references only code can check.
 */
export function validateCapabilityManifest(value) {
  if (!isObject(value)) return ['capability manifest must be an object'];
  const issues = [...validateManifestSchema(value), ...validateCrossReferences(value)];
  return [...new Set(issues)];
}

/**
 * Cross-manifest validation. This is the single governance point for graph
 * closure, symmetric conflicts, adapter compatibility and acyclicity.
 */
export function validateCapabilityRegistry(manifests) {
  const issues = [];
  const byId = new Map();
  for (const manifest of manifests) {
    if (byId.has(manifest.id)) issues.push(`duplicate capability manifest: ${manifest.id}`);
    byId.set(manifest.id, manifest);
  }

  for (const manifest of manifests) {
    for (const required of manifest.requires) {
      if (!byId.has(required)) issues.push(`${manifest.id} requires unknown capability ${required}`);
      if (required === manifest.id) issues.push(`${manifest.id} cannot require itself`);
      if (manifest.conflicts.some((conflict) => conflict.id === required)) {
        issues.push(`${manifest.id} both requires and conflicts ${required}`);
      }
    }
    for (const conflict of manifest.conflicts) {
      const other = byId.get(conflict.id);
      if (!other) {
        issues.push(`${manifest.id} conflicts with unknown capability ${conflict.id}`);
        continue;
      }
      const reverse = other.conflicts.find((candidate) => candidate.id === manifest.id);
      if (!reverse) issues.push(`${manifest.id} conflict with ${conflict.id} is not symmetric`);
      else if (reverse.reason !== conflict.reason) {
        issues.push(`${manifest.id} conflict with ${conflict.id} must use the same reason in both manifests`);
      }
    }
    for (const [runtimeId, target] of Object.entries(manifest.targets)) {
      if (target.status !== 'ready') continue;
      const adapter = getTargetAdapter(target.adapter.id);
      if (!adapter) issues.push(`${manifest.id}/${runtimeId} references unknown adapter ${target.adapter.id}`);
      else if (adapter.version !== target.adapter.version) {
        issues.push(`${manifest.id}/${runtimeId} requires adapter ${target.adapter.version} but registry provides ${adapter.version}`);
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const stack = [];
  const visit = (id) => {
    if (visited.has(id) || !byId.has(id)) return;
    if (visiting.has(id)) {
      const start = stack.indexOf(id);
      issues.push(`capability dependency cycle: ${[...stack.slice(start), id].join(' -> ')}`);
      return;
    }
    visiting.add(id);
    stack.push(id);
    for (const required of [...byId.get(id).requires].sort()) visit(required);
    stack.pop();
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of [...byId.keys()].sort()) visit(id);
  return [...new Set(issues)];
}

/**
 * Resolves requested capabilities to a deterministic dependency-first closure.
 * Auto-included nodes and direct edges are explicit; no bundle is introduced.
 */
export function resolveCapabilityGraph(requested, manifests) {
  const registryIssues = validateCapabilityRegistry(manifests);
  const byId = new Map(manifests.map((manifest) => [manifest.id, manifest]));
  const requestedIds = [...new Set(requested)].sort();
  const issues = [...registryIssues];
  const visiting = new Set();
  const visited = new Set();
  const order = [];
  const edges = [];

  const visit = (id, path = []) => {
    if (visited.has(id)) return;
    const manifest = byId.get(id);
    if (!manifest) {
      issues.push(`unknown requested capability ${id}`);
      return;
    }
    if (visiting.has(id)) {
      issues.push(`capability dependency cycle: ${[...path, id].join(' -> ')}`);
      return;
    }
    visiting.add(id);
    for (const dependency of [...manifest.requires].sort()) {
      edges.push({ from: id, to: dependency });
      visit(dependency, [...path, id]);
    }
    visiting.delete(id);
    visited.add(id);
    order.push(id);
  };
  for (const id of requestedIds) visit(id);

  const selected = new Set(order);
  const conflictPairs = new Set();
  for (const id of order) {
    for (const conflict of byId.get(id)?.conflicts ?? []) {
      if (!selected.has(conflict.id)) continue;
      const pair = [id, conflict.id].sort().join('|');
      if (conflictPairs.has(pair)) continue;
      conflictPairs.add(pair);
      issues.push(`capability conflict ${pair.replace('|', ' <-> ')}: ${conflict.reason}`);
    }
  }

  return {
    requested: requestedIds,
    order,
    autoIncluded: order.filter((id) => !requestedIds.includes(id)),
    edges: edges
      .filter((edge, index, all) => all.findIndex((candidate) =>
        candidate.from === edge.from && candidate.to === edge.to) === index)
      .sort((left, right) => `${left.from}|${left.to}`.localeCompare(`${right.from}|${right.to}`)),
    issues: [...new Set(issues)],
  };
}

/**
 * Compatibility helper for profile governance: unlike runtime resolution, a
 * named profile must declare its complete closure rather than relying on an
 * implicit preset mutation.
 */
export function validateCapabilityDependencies(selected, manifests) {
  if (!manifests?.length) return [];
  const graph = resolveCapabilityGraph(selected, manifests);
  const missing = graph.autoIncluded.map((id) => {
    const requiredBy = graph.edges.filter((edge) => edge.to === id).map((edge) => edge.from).sort();
    return `${requiredBy.join(', ')} requires ${id}`;
  });
  return [...new Set([...graph.issues, ...missing])];
}

async function validateCapabilityRepository(repoRoot, manifests) {
  const issues = [];
  for (const manifest of manifests) {
    const capabilityRoot = join(repoRoot, 'capabilities', manifest.id);
    for (const migration of manifest.migrations) {
      try {
        await readFile(join(capabilityRoot, migration.path));
      } catch {
        issues.push(`${manifest.id} migration payload is missing: ${migration.path}`);
      }
    }
    for (const [runtimeId, target] of Object.entries(manifest.targets)) {
      if (target.status !== 'ready' || target.mode !== 'overlay') continue;
      const overlayPath = join(capabilityRoot, 'targets', runtimeId, 'overlay.json');
      try {
        const overlay = JSON.parse(await readFile(overlayPath, 'utf8'));
        if (overlay.capability !== manifest.id || overlay.target !== runtimeId) {
          issues.push(`${manifest.id}/${runtimeId} overlay identity does not match the capability target`);
        }
        if (overlay.version !== manifest.version) {
          issues.push(`${manifest.id}/${runtimeId} overlay version ${overlay.version} does not match manifest ${manifest.version}`);
        }
      } catch {
        issues.push(`${manifest.id}/${runtimeId} ready overlay is missing or invalid`);
      }
    }
  }
  return issues;
}

export async function discoverCapabilityIds(repoRoot = FOUNDATION_ROOT) {
  const entries = await readdir(join(repoRoot, 'capabilities'), { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

export async function loadCapabilityManifests(repoRoot, selected) {
  const known = await discoverCapabilityIds(repoRoot);
  const manifests = [];
  for (const id of known) {
    const value = JSON.parse(await readFile(join(repoRoot, 'capabilities', id, 'capability.json'), 'utf8'));
    const issues = validateCapabilityManifest(value);
    if (value.id !== id) issues.push(`id must match directory ${id}`);
    if (issues.length) throw new Error(`${id} capability manifest invalid:\n- ${issues.join('\n- ')}`);
    manifests.push(value);
  }
  const registryIssues = validateCapabilityRegistry(manifests);
  const repositoryIssues = await validateCapabilityRepository(repoRoot, manifests);
  const issues = [...registryIssues, ...repositoryIssues];
  if (issues.length) throw new Error(`Capability registry invalid:\n- ${issues.join('\n- ')}`);
  if (selected === undefined) return manifests;
  const requested = [...new Set(selected.filter((candidate) => candidate !== 'base'))].sort();
  const graph = resolveCapabilityGraph(requested, manifests);
  if (graph.issues.length) {
    throw new Error(`Capability selection invalid:\n- ${graph.issues.join('\n- ')}`);
  }
  const byId = new Map(manifests.map((manifest) => [manifest.id, manifest]));
  return graph.order.map((id) => byId.get(id));
}

/**
 * A selection is composable when every selected capability is `ready` or
 * `not-applicable` on every selected runtime.
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
    Object.fromEntries(STARTER_IDS.map((starterId) => [
      starterId,
      manifest.targets[starterId].status,
    ])),
  ]));
}
