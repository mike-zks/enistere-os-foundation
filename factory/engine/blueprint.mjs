import { readFile } from 'node:fs/promises';
import { CAPABILITY_IDS, validateCapabilityDependencies } from './capabilities.mjs';
import { validateEntities } from './contracts.mjs';
import { validateBlueprintProfile } from './profiles.mjs';
import { APPLICATION_KINDS, ARCHITECTURE_STYLES } from './topologies.mjs';
import { assertGeneratableTopology, validateApplications } from './applications.mjs';

// The application-kind registry is the single source of truth for valid runtimes
// per slot; the stack sugar derives its enums from it.
const APIS = new Set(APPLICATION_KINDS.api.runtimes);
const WEBS = new Set([null, ...APPLICATION_KINDS.web.runtimes]);
const MOBILES = new Set([null, ...APPLICATION_KINDS.mobile.runtimes]);
const CAPABILITIES = new Set(CAPABILITY_IDS);
const LEGACY_INPUT_CAPABILITIES = new Set(['base']);
const ENVIRONMENTS = new Set(['local', 'staging']);
const SLUG = /^[a-z][a-z0-9-]{1,62}$/;

export async function readBlueprint(path) {
  const source = await readFile(path, 'utf8');
  try {
    return JSON.parse(source);
  } catch {
    throw new Error('Blueprint v1 must use the JSON-compatible YAML subset.');
  }
}

export function validateBlueprint(value) {
  const issues = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ['blueprint must be an object'];
  if (value.version !== '1') issues.push('version must be "1"');
  if (!value.project || typeof value.project !== 'object') issues.push('project is required');
  if (typeof value.project?.name !== 'string' || value.project.name.trim() === '') issues.push('project.name is required');
  if (!SLUG.test(value.project?.slug ?? '')) issues.push('project.slug must be lowercase kebab-case (2-63 chars)');
  if (value.topology !== 'monorepo') issues.push('topology must be "monorepo"');
  if (typeof value.designSystem !== 'boolean') issues.push('designSystem must be a boolean');

  // Surface: exactly one of `stack` (single-surface sugar) or `applications`
  // (canonical model). Both resolve to the same engine model (see applications.mjs).
  const hasStack = value.stack !== undefined;
  const hasApplications = value.applications !== undefined;
  if (hasStack === hasApplications) {
    issues.push('exactly one of stack or applications is required');
  } else if (hasApplications) {
    const appIssues = validateApplications(value.applications);
    issues.push(...appIssues);
    // The generatability gate (API-invariant, planned kinds, multi-surface) only
    // runs on a structurally sound list.
    if (appIssues.length === 0) issues.push(...assertGeneratableTopology(value));
  } else {
    for (const key of Object.keys(value.stack)) if (!['api', 'web', 'mobile'].includes(key)) issues.push(`stack.${key} is not a known field`);
    if (!APIS.has(value.stack.api)) issues.push('stack.api must be nestjs or spring');
    if (!WEBS.has(value.stack.web ?? null)) issues.push('stack.web must be nextjs, angular or null');
    if (!MOBILES.has(value.stack.mobile ?? null)) issues.push('stack.mobile must be react-native, flutter or null');
  }

  if (value.architecture !== undefined) {
    if (!value.architecture || typeof value.architecture !== 'object' || Array.isArray(value.architecture)) issues.push('architecture must be an object');
    else {
      for (const key of Object.keys(value.architecture)) if (!['style', 'evolutionTarget'].includes(key)) issues.push(`architecture.${key} is not a known field`);
      if (!ARCHITECTURE_STYLES.includes(value.architecture.style)) issues.push('architecture.style is invalid');
      if (value.architecture.evolutionTarget !== undefined && !ARCHITECTURE_STYLES.includes(value.architecture.evolutionTarget)) issues.push('architecture.evolutionTarget is invalid');
    }
  }

  if (!Array.isArray(value.domain?.entities)) issues.push('domain.entities must be an array');
  else issues.push(...validateEntities(value.domain.entities));
  if (!Array.isArray(value.capabilities)) issues.push('capabilities must be an array');
  else {
    if (new Set(value.capabilities).size !== value.capabilities.length) issues.push('capabilities must be unique');
    for (const item of value.capabilities) {
      if (!CAPABILITIES.has(item) && !LEGACY_INPUT_CAPABILITIES.has(item)) issues.push(`unknown capability: ${item}`);
    }
    issues.push(...validateCapabilityDependencies(value.capabilities.filter((id) => id !== 'base')));
  }
  const environments = value.deployment?.environments;
  if (!Array.isArray(environments)) issues.push('deployment.environments must be an array');
  else {
    if (!environments.includes('local')) issues.push('deployment.environments must include local');
    if (new Set(environments).size !== environments.length) issues.push('deployment.environments must be unique');
    for (const item of environments) if (!ENVIRONMENTS.has(item)) issues.push(`unsupported environment: ${item}`);
  }
  // The profile is checked last: it compares against the stack and the
  // capabilities, so it is only meaningful once both are structurally sound.
  if (value.profile !== undefined) {
    if (typeof value.profile !== 'string') issues.push('profile must be a string');
    else if (issues.length === 0) {
      // `getProfile` refuses unknown and API-less names by throwing; its message
      // already carries the invariant and the alternatives.
      try { issues.push(...validateBlueprintProfile(value)); }
      catch (error) { issues.push(...error.message.split('\n')); }
    }
  }
  return issues;
}

export function assertBlueprint(value) {
  const issues = validateBlueprint(value);
  if (issues.length) throw new Error(`Invalid blueprint:\n- ${issues.join('\n- ')}`);
  return value;
}

export function createDefaultBlueprint(slug = 'enistere-app') {
  return {
    version: '1',
    project: { name: slug.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' '), slug },
    topology: 'monorepo',
    designSystem: true,
    stack: { api: 'spring', web: 'angular', mobile: null },
    domain: { entities: [] },
    capabilities: [],
    deployment: { environments: ['local', 'staging'] },
  };
}
