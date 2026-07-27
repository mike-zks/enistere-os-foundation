import { readFile, readdir } from 'node:fs/promises';
import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STARTER_IDS } from './starters.mjs';
import { getTargetAdapter } from './target-adapters.mjs';

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

export const CAPABILITY_STATUSES = Object.freeze([
  'ready',
  'planned',
  'unsupported',
  'not-applicable',
]);
export const NON_BLOCKING_STATUSES = Object.freeze(['ready', 'not-applicable']);
export const INFRASTRUCTURE_PRIMITIVE_KINDS = Object.freeze([
  'relational-database',
  'document-database',
  'cache',
  'object-storage',
  'content-repository',
  'queue',
  'broker',
  'mail',
  'push',
  'search',
  'telemetry-backend',
  'secrets',
]);
export const CAPABILITY_DEPLOYMENT_MODES = Object.freeze([
  'embedded',
  'dedicated-service',
  'shared-service',
]);

const STATUSES = new Set(CAPABILITY_STATUSES);
const PRIMITIVE_KINDS = new Set(INFRASTRUCTURE_PRIMITIVE_KINDS);
const DEPLOYMENT_MODES = new Set(CAPABILITY_DEPLOYMENT_MODES);
const SEMVER = /^\d+\.\d+\.\d+$/;
const SLUG = /^[a-z][a-z0-9-]{1,63}$/;
const CONFIG_TYPES = new Set(['enum', 'string', 'boolean', 'integer']);
const CONTRACT_KINDS = new Set(['api', 'event', 'schema', 'ui']);
const PRIMITIVE_REQUIREMENTS = new Set(['required', 'optional']);
const MIGRATION_KINDS = new Set(['database', 'data', 'index', 'configuration']);
const MIGRATION_STRATEGIES = new Set(['additive', 'transform', 'rebuild']);
const CONFORMANCE_LEVELS = new Set(['unit', 'integration', 'contract', 'e2e']);
const CONFORMANCE_EVIDENCE = new Set([
  'overlay-verification',
  'golden-runtime',
  'repository-test',
]);
const KNOWN_KEYS = new Set([
  'schemaVersion',
  'id',
  'version',
  'requires',
  'conflicts',
  'responsibilities',
  'contracts',
  'primitives',
  'configuration',
  'targets',
  'migrations',
  'conformance',
]);
const REQUIRED_KEYS = [...KNOWN_KEYS];
const TARGET_KEYS = new Set([
  'status',
  'mode',
  'adapter',
  'contracts',
  'primitives',
  'deploymentModes',
  'migrations',
  'conformance',
]);
const READY_TARGET_KEYS = [...TARGET_KEYS].filter((key) => key !== 'status');

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

function validateConfiguration(configuration) {
  const issues = [];
  if (!isObject(configuration)) return ['configuration must be an object'];
  for (const [name, spec] of Object.entries(configuration)) {
    if (!SLUG.test(name)) issues.push(`configuration.${name} has an invalid id`);
    if (!isObject(spec)) {
      issues.push(`configuration.${name} must be an object`);
      continue;
    }
    for (const key of Object.keys(spec)) {
      if (!['type', 'values', 'default', 'required', 'sensitive'].includes(key)) {
        issues.push(`configuration.${name}.${key} is not supported`);
      }
    }
    if (!CONFIG_TYPES.has(spec.type)) issues.push(`configuration.${name}.type is invalid`);
    if (spec.required !== undefined && typeof spec.required !== 'boolean') {
      issues.push(`configuration.${name}.required must be a boolean`);
    }
    if (spec.sensitive !== undefined && typeof spec.sensitive !== 'boolean') {
      issues.push(`configuration.${name}.sensitive must be a boolean`);
    }
    if (spec.type === 'enum') {
      issues.push(...validateUniqueStrings(spec.values, `configuration.${name}.values`));
      if (spec.default !== undefined && !spec.values?.includes(spec.default)) {
        issues.push(`configuration.${name}.default must be one of values`);
      }
    } else if (spec.values !== undefined) {
      issues.push(`configuration.${name}.values is only allowed for enum`);
    }
  }
  return issues;
}

function validateDefinitions(manifest) {
  const issues = [];

  if (!Array.isArray(manifest.conflicts)) {
    issues.push('conflicts must be an array');
  } else {
    const ids = [];
    for (const [index, conflict] of manifest.conflicts.entries()) {
      if (!isObject(conflict)) {
        issues.push(`conflicts[${index}] must be an object`);
        continue;
      }
      for (const key of Object.keys(conflict)) {
        if (!['id', 'reason'].includes(key)) issues.push(`conflicts[${index}].${key} is not supported`);
      }
      if (!SLUG.test(conflict.id ?? '')) issues.push(`conflicts[${index}].id is invalid`);
      if (typeof conflict.reason !== 'string' || conflict.reason.trim() === '') {
        issues.push(`conflicts[${index}].reason is required`);
      }
      ids.push(conflict.id);
    }
    if (new Set(ids).size !== ids.length) issues.push('conflicts must be unique by id');
  }

  if (!Array.isArray(manifest.contracts)) {
    issues.push('contracts must be an array');
  } else {
    const ids = [];
    for (const [index, contract] of manifest.contracts.entries()) {
      if (!isObject(contract)) {
        issues.push(`contracts[${index}] must be an object`);
        continue;
      }
      for (const key of Object.keys(contract)) {
        if (!['id', 'version', 'kind'].includes(key)) issues.push(`contracts[${index}].${key} is not supported`);
      }
      if (!SLUG.test(contract.id ?? '')) issues.push(`contracts[${index}].id is invalid`);
      if (!SEMVER.test(contract.version ?? '')) issues.push(`contracts[${index}].version must use SemVer`);
      if (!CONTRACT_KINDS.has(contract.kind)) issues.push(`contracts[${index}].kind is invalid`);
      ids.push(contract.id);
    }
    if (new Set(ids).size !== ids.length) issues.push('contracts must have unique ids');
  }

  if (!Array.isArray(manifest.primitives)) {
    issues.push('primitives must be an array');
  } else {
    const ids = [];
    for (const [index, primitive] of manifest.primitives.entries()) {
      if (!isObject(primitive)) {
        issues.push(`primitives[${index}] must be an object`);
        continue;
      }
      for (const key of Object.keys(primitive)) {
        if (!['id', 'kind', 'requirement', 'purposes'].includes(key)) {
          issues.push(`primitives[${index}].${key} is not supported`);
        }
      }
      if (!SLUG.test(primitive.id ?? '')) issues.push(`primitives[${index}].id is invalid`);
      if (!PRIMITIVE_KINDS.has(primitive.kind)) issues.push(`primitives[${index}].kind is invalid`);
      if (!PRIMITIVE_REQUIREMENTS.has(primitive.requirement)) {
        issues.push(`primitives[${index}].requirement is invalid`);
      }
      issues.push(...validateUniqueStrings(primitive.purposes, `primitives[${index}].purposes`));
      ids.push(primitive.id);
    }
    if (new Set(ids).size !== ids.length) issues.push('primitives must have unique ids');
  }

  if (!Array.isArray(manifest.migrations)) {
    issues.push('migrations must be an array');
  } else {
    const ids = [];
    for (const [index, migration] of manifest.migrations.entries()) {
      if (!isObject(migration)) {
        issues.push(`migrations[${index}] must be an object`);
        continue;
      }
      for (const key of Object.keys(migration)) {
        if (!['id', 'target', 'kind', 'strategy', 'path', 'order'].includes(key)) {
          issues.push(`migrations[${index}].${key} is not supported`);
        }
      }
      if (!SLUG.test(migration.id ?? '')) issues.push(`migrations[${index}].id is invalid`);
      if (!STARTER_IDS.includes(migration.target)) issues.push(`migrations[${index}].target is invalid`);
      if (!MIGRATION_KINDS.has(migration.kind)) issues.push(`migrations[${index}].kind is invalid`);
      if (!MIGRATION_STRATEGIES.has(migration.strategy)) issues.push(`migrations[${index}].strategy is invalid`);
      if (typeof migration.path !== 'string' || !migration.path.startsWith(`targets/${migration.target}/`)) {
        issues.push(`migrations[${index}].path must belong to target ${migration.target}`);
      }
      if (!Number.isInteger(migration.order) || migration.order < 0) {
        issues.push(`migrations[${index}].order must be a non-negative integer`);
      }
      ids.push(migration.id);
    }
    if (new Set(ids).size !== ids.length) issues.push('migrations must have unique ids');
  }

  if (!Array.isArray(manifest.conformance)) {
    issues.push('conformance must be an array');
  } else {
    const ids = [];
    for (const [index, suite] of manifest.conformance.entries()) {
      if (!isObject(suite)) {
        issues.push(`conformance[${index}] must be an object`);
        continue;
      }
      for (const key of Object.keys(suite)) {
        if (!['id', 'target', 'level', 'evidence'].includes(key)) {
          issues.push(`conformance[${index}].${key} is not supported`);
        }
      }
      if (!SLUG.test(suite.id ?? '')) issues.push(`conformance[${index}].id is invalid`);
      if (!STARTER_IDS.includes(suite.target)) issues.push(`conformance[${index}].target is invalid`);
      if (!CONFORMANCE_LEVELS.has(suite.level)) issues.push(`conformance[${index}].level is invalid`);
      if (!CONFORMANCE_EVIDENCE.has(suite.evidence)) issues.push(`conformance[${index}].evidence is invalid`);
      ids.push(suite.id);
    }
    if (new Set(ids).size !== ids.length) issues.push('conformance must have unique ids');
  }
  return issues;
}

function validateTargets(manifest) {
  const issues = [];
  if (!isObject(manifest.targets)) return ['targets must be an object'];
  for (const key of Object.keys(manifest.targets)) {
    if (!STARTER_IDS.includes(key)) issues.push(`targets.${key} is not a known runtime`);
  }

  const contractIds = new Set((manifest.contracts ?? []).map((item) => item.id));
  const primitiveIds = new Set((manifest.primitives ?? []).map((item) => item.id));
  const migrationIds = new Set((manifest.migrations ?? []).map((item) => item.id));
  const conformanceIds = new Set((manifest.conformance ?? []).map((item) => item.id));

  for (const runtimeId of STARTER_IDS) {
    const target = manifest.targets[runtimeId];
    if (!isObject(target)) {
      issues.push(`targets.${runtimeId} is required`);
      continue;
    }
    for (const key of Object.keys(target)) {
      if (!TARGET_KEYS.has(key)) issues.push(`targets.${runtimeId}.${key} is not a known field`);
    }
    if (!STATUSES.has(target.status)) issues.push(`targets.${runtimeId}.status is invalid`);
    if (target.status !== 'ready') {
      for (const key of READY_TARGET_KEYS) {
        if (target[key] !== undefined) issues.push(`targets.${runtimeId}.${key} is only allowed when ready`);
      }
      continue;
    }

    if (!['built-in', 'overlay'].includes(target.mode)) {
      issues.push(`targets.${runtimeId}.mode is required when ready`);
    }
    if (!isObject(target.adapter)) {
      issues.push(`targets.${runtimeId}.adapter is required when ready`);
    } else {
      for (const key of Object.keys(target.adapter)) {
        if (!['id', 'version'].includes(key)) issues.push(`targets.${runtimeId}.adapter.${key} is not supported`);
      }
      if (target.adapter.id !== runtimeId) issues.push(`targets.${runtimeId}.adapter.id must be ${runtimeId}`);
      if (!SEMVER.test(target.adapter.version ?? '')) issues.push(`targets.${runtimeId}.adapter.version must use SemVer`);
    }

    for (const [field, known] of [
      ['contracts', contractIds],
      ['primitives', primitiveIds],
      ['migrations', migrationIds],
      ['conformance', conformanceIds],
    ]) {
      issues.push(...validateUniqueStrings(target[field], `targets.${runtimeId}.${field}`, { required: field === 'conformance' }));
      for (const id of target[field] ?? []) {
        if (!known.has(id)) issues.push(`targets.${runtimeId}.${field} references unknown ${id}`);
      }
    }
    issues.push(...validateUniqueStrings(target.deploymentModes, `targets.${runtimeId}.deploymentModes`));
    for (const mode of target.deploymentModes ?? []) {
      if (!DEPLOYMENT_MODES.has(mode)) issues.push(`targets.${runtimeId}.deploymentModes contains invalid ${mode}`);
    }

    for (const migrationId of target.migrations ?? []) {
      const migration = manifest.migrations?.find((item) => item.id === migrationId);
      if (migration?.target !== runtimeId) {
        issues.push(`targets.${runtimeId}.migrations references migration ${migrationId} owned by ${migration?.target}`);
      }
    }
    for (const suiteId of target.conformance ?? []) {
      const suite = manifest.conformance?.find((item) => item.id === suiteId);
      if (suite?.target !== runtimeId) {
        issues.push(`targets.${runtimeId}.conformance references suite ${suiteId} owned by ${suite?.target}`);
      }
    }
  }
  return issues;
}

/** Validates the closed, complete Capability Manifest v2 shape. */
export function validateCapabilityManifest(value) {
  const issues = [];
  if (!isObject(value)) return ['capability manifest must be an object'];
  for (const key of Object.keys(value)) {
    if (!KNOWN_KEYS.has(key)) issues.push(`unknown property: ${key}`);
  }
  for (const key of REQUIRED_KEYS) {
    if (value[key] === undefined) issues.push(`${key} is required`);
  }
  if (value.schemaVersion !== '2') issues.push('schemaVersion must be 2');
  if (!SLUG.test(value.id ?? '')) issues.push('id is invalid');
  if (!SEMVER.test(value.version ?? '')) issues.push('version must use SemVer');
  issues.push(...validateUniqueStrings(value.requires, 'requires', { required: false }));
  issues.push(...validateUniqueStrings(value.responsibilities, 'responsibilities'));
  issues.push(...validateConfiguration(value.configuration));
  issues.push(...validateDefinitions(value));
  issues.push(...validateTargets(value));
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
