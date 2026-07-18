import { readFile } from 'node:fs/promises';
import { CAPABILITY_IDS, validateCapabilityDependencies } from './capabilities.mjs';
import { validateEntities } from './contracts.mjs';

const APIS = new Set(['nestjs', 'spring']);
const WEBS = new Set([null, 'nextjs', 'angular']);
const MOBILES = new Set([null, 'react-native', 'flutter']);
const CAPABILITIES = new Set(CAPABILITY_IDS);
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
  if (!APIS.has(value.stack?.api)) issues.push('stack.api must be nestjs or spring');
  if (!WEBS.has(value.stack?.web ?? null)) issues.push('stack.web must be nextjs, angular or null');
  if (!MOBILES.has(value.stack?.mobile ?? null)) issues.push('stack.mobile must be react-native, flutter or null');
  if (!Array.isArray(value.domain?.entities)) issues.push('domain.entities must be an array');
  else issues.push(...validateEntities(value.domain.entities));
  if (!Array.isArray(value.capabilities)) issues.push('capabilities must be an array');
  else {
    if (!value.capabilities.includes('base')) issues.push('capabilities must include base');
    if (new Set(value.capabilities).size !== value.capabilities.length) issues.push('capabilities must be unique');
    for (const item of value.capabilities) if (!CAPABILITIES.has(item)) issues.push(`unknown capability: ${item}`);
    issues.push(...validateCapabilityDependencies(value.capabilities));
  }
  const environments = value.deployment?.environments;
  if (!Array.isArray(environments)) issues.push('deployment.environments must be an array');
  else {
    if (!environments.includes('local')) issues.push('deployment.environments must include local');
    if (new Set(environments).size !== environments.length) issues.push('deployment.environments must be unique');
    for (const item of environments) if (!ENVIRONMENTS.has(item)) issues.push(`unsupported environment: ${item}`);
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
    capabilities: ['base'],
    deployment: { environments: ['local', 'staging'] },
  };
}
