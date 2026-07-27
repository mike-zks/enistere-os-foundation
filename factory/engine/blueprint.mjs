import { readFile } from 'node:fs/promises';
import { CAPABILITY_IDS, validateCapabilityDependencies } from './capabilities.mjs';
import { validateEntities } from './contracts.mjs';
import { validateBlueprintProfile } from './profiles.mjs';
import { APPLICATION_KINDS } from './topologies.mjs';
import { validateApplications, validateRepresentableTopology } from './applications.mjs';
import {
  BACKEND_STYLES,
  CLIENT_MODES,
  COMMUNICATION_MODES,
  DATA_OWNERSHIP_MODES,
  DEPLOYMENT_COUPLINGS,
  LEGACY_SYSTEM_PROFILE_ALIASES,
  OPERATIONS_MATURITY_LEVELS,
  SYSTEM_PROFILES,
} from '../model/system-profiles.mjs';

// The application-kind registry is the single source of truth for valid runtimes
// per slot; the stack sugar derives its enums from it.
const APIS = new Set(APPLICATION_KINDS.api.runtimes);
const WEBS = new Set([null, ...APPLICATION_KINDS.web.runtimes]);
const MOBILES = new Set([null, ...APPLICATION_KINDS.mobile.runtimes]);
const CAPABILITIES = new Set(CAPABILITY_IDS);
const LEGACY_INPUT_CAPABILITIES = new Set(['base']);
const ENVIRONMENTS = new Set(['local', 'staging']);
const SLUG = /^[a-z][a-z0-9-]{1,62}$/;
const SYSTEM_PROFILE_INPUTS = new Set([...SYSTEM_PROFILES, ...Object.keys(LEGACY_SYSTEM_PROFILE_ALIASES)]);
const LEGACY_ARCHITECTURE_STYLES = new Set(['monolith', 'modular-monolith', 'microservices']);
const COMMUNICATION_EDGE_MODES = new Set(['synchronous', 'asynchronous']);
const COMMUNICATION_PROTOCOLS = new Set(['http', 'amqp']);
const COMMUNICATION_IDENTITIES = new Set(['workload']);
const FAILURE_POLICIES = new Set(['fail-fast', 'degrade', 'queue']);

function validateArchitectureObject(issues, architecture, key, field, allowed) {
  const value = architecture[key];
  if (value === undefined) return;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    issues.push(`architecture.${key} must be an object`);
    return;
  }
  for (const child of Object.keys(value)) if (child !== field) issues.push(`architecture.${key}.${child} is not a known field`);
  if (!allowed.includes(value[field])) issues.push(`architecture.${key}.${field} is invalid`);
}

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
    // Representation and generation are deliberately separate. Multi-backend
    // input reaches the CSM and resolver; unsupported materialization is then
    // reported as a structured architecture blocker.
    if (appIssues.length === 0) issues.push(...validateRepresentableTopology(value));
  } else {
    for (const key of Object.keys(value.stack)) if (!['api', 'web', 'mobile'].includes(key)) issues.push(`stack.${key} is not a known field`);
    if (!APIS.has(value.stack.api)) issues.push('stack.api must be nestjs, spring or fastapi');
    if (!WEBS.has(value.stack.web ?? null)) issues.push('stack.web must be nextjs, angular or null');
    if (!MOBILES.has(value.stack.mobile ?? null)) issues.push('stack.mobile must be react-native, flutter or null');
  }

  if (value.communications !== undefined) {
    if (!Array.isArray(value.communications)) issues.push('communications must be an array');
    else {
      const communicationIds = new Set();
      value.communications.forEach((communication, index) => {
        const path = `communications[${index}]`;
        if (!communication || typeof communication !== 'object' || Array.isArray(communication)) {
          issues.push(`${path} must be an object`);
          return;
        }
        const known = ['id', 'from', 'to', 'mode', 'protocol', 'contract', 'timeoutMs', 'maxAttempts', 'identity', 'failurePolicy'];
        for (const key of Object.keys(communication)) if (!known.includes(key)) issues.push(`${path}.${key} is not a known field`);
        if (!SLUG.test(communication.id ?? '')) issues.push(`${path}.id must be kebab-case`);
        else if (communicationIds.has(communication.id)) issues.push(`${path}.id is duplicated: ${communication.id}`);
        communicationIds.add(communication.id);
        if (typeof communication.from !== 'string' || communication.from === '') issues.push(`${path}.from is required`);
        if (typeof communication.to !== 'string' || communication.to === '') issues.push(`${path}.to is required`);
        if (!COMMUNICATION_EDGE_MODES.has(communication.mode)) issues.push(`${path}.mode is invalid`);
        if (!COMMUNICATION_PROTOCOLS.has(communication.protocol)) issues.push(`${path}.protocol is invalid`);
        if (typeof communication.contract !== 'string' || !/^[a-z][a-z0-9.-]*\.v[1-9][0-9]*$/.test(communication.contract)) {
          issues.push(`${path}.contract must be a versioned id ending in .vN`);
        }
        if (!Number.isInteger(communication.timeoutMs) || communication.timeoutMs < 1) issues.push(`${path}.timeoutMs must be a positive integer`);
        if (!Number.isInteger(communication.maxAttempts) || communication.maxAttempts < 1 || communication.maxAttempts > 5) {
          issues.push(`${path}.maxAttempts must be an integer from 1 to 5`);
        }
        if (!COMMUNICATION_IDENTITIES.has(communication.identity)) issues.push(`${path}.identity is invalid`);
        if (!FAILURE_POLICIES.has(communication.failurePolicy)) issues.push(`${path}.failurePolicy is invalid`);
      });
    }
  }

  if (value.architecture !== undefined) {
    if (!value.architecture || typeof value.architecture !== 'object' || Array.isArray(value.architecture)) issues.push('architecture must be an object');
    else {
      const known = ['profile', 'style', 'evolutionTarget', 'clients', 'backend', 'deployment', 'data', 'communication', 'operations'];
      for (const key of Object.keys(value.architecture)) if (!known.includes(key)) issues.push(`architecture.${key} is not a known field`);
      if (value.architecture.profile !== undefined && !SYSTEM_PROFILE_INPUTS.has(value.architecture.profile)) issues.push('architecture.profile is invalid');
      if (value.architecture.style !== undefined && !LEGACY_ARCHITECTURE_STYLES.has(value.architecture.style)) issues.push('architecture.style is invalid');
      if (value.architecture.evolutionTarget !== undefined && !SYSTEM_PROFILE_INPUTS.has(value.architecture.evolutionTarget)) issues.push('architecture.evolutionTarget is invalid');
      validateArchitectureObject(issues, value.architecture, 'clients', 'mode', CLIENT_MODES);
      validateArchitectureObject(issues, value.architecture, 'backend', 'style', BACKEND_STYLES);
      validateArchitectureObject(issues, value.architecture, 'deployment', 'coupling', DEPLOYMENT_COUPLINGS);
      validateArchitectureObject(issues, value.architecture, 'data', 'ownership', DATA_OWNERSHIP_MODES);
      validateArchitectureObject(issues, value.architecture, 'communication', 'primary', COMMUNICATION_MODES);
      validateArchitectureObject(issues, value.architecture, 'operations', 'maturity', OPERATIONS_MATURITY_LEVELS);
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
    communications: [],
    deployment: { environments: ['local', 'staging'] },
  };
}
