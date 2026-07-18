import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const STARTER_IDS = Object.freeze(['nestjs', 'spring', 'nextjs', 'angular', 'react-native', 'flutter']);
const KINDS = new Set(['api', 'web', 'mobile']);
const COMMANDS = ['install', 'dev', 'test', 'build', 'verify'];

export function validateStarterManifest(value) {
  const issues = [];
  if (value?.schemaVersion !== '2') issues.push('schemaVersion must be 2');
  if (!STARTER_IDS.includes(value?.id)) issues.push('id is not registered');
  if (!KINDS.has(value?.kind)) issues.push('kind is invalid');
  if (typeof value?.framework !== 'string' || !value.framework) issues.push('framework is required');
  for (const command of COMMANDS) if (!Array.isArray(value?.commands?.[command]) || value.commands[command].length === 0) issues.push(`commands.${command} is required`);
  if (value?.composition?.contractVersion !== '1') issues.push('composition.contractVersion must be 1');
  if (value?.composition?.base !== 'built-in') issues.push('composition.base must be built-in');
  if (value?.composition?.model !== undefined && !['modular', 'bundled'].includes(value.composition.model)) {
    issues.push('composition.model must be modular or bundled');
  }
  for (const key of ['readyCapabilities', 'plannedCapabilities']) if (!Array.isArray(value?.composition?.[key])) issues.push(`composition.${key} must be an array`);
  const ready = value?.composition?.readyCapabilities ?? [];
  const planned = value?.composition?.plannedCapabilities ?? [];
  for (const id of ready) if (planned.includes(id)) issues.push(`capability cannot be ready and planned: ${id}`);
  return issues;
}

export async function loadStarterManifests(repoRoot) {
  return Promise.all(STARTER_IDS.map(async (id) => {
    const value = JSON.parse(await readFile(join(repoRoot, 'starters', id, 'starter.manifest.json'), 'utf8'));
    const issues = validateStarterManifest(value);
    if (issues.length) throw new Error(`${id} manifest invalid:\n- ${issues.join('\n- ')}`);
    return value;
  }));
}

export function validateManifestConsistency(starters, capabilities) {
  const issues = [];
  const byStarter = new Map(starters.map((starter) => [starter.id, starter]));
  for (const capability of capabilities) {
    for (const starterId of STARTER_IDS) {
      const starter = byStarter.get(starterId);
      const target = capability.targets[starterId];
      if (capability.id === 'base') continue;
      const declaredReady = starter.composition.readyCapabilities.includes(capability.id);
      const declaredPlanned = starter.composition.plannedCapabilities.includes(capability.id);
      if (target.status === 'ready' && !declaredReady) issues.push(`${starterId}/${capability.id}: target ready but starter does not declare ready`);
      if (target.status === 'planned' && !declaredPlanned) issues.push(`${starterId}/${capability.id}: target planned but starter does not declare planned`);
      if (target.status === 'unsupported' && (declaredReady || declaredPlanned)) issues.push(`${starterId}/${capability.id}: unsupported target declared by starter`);
    }
  }
  return issues;
}

export function selectedStarterIds(blueprint) {
  return [blueprint.stack.api, blueprint.stack.web, blueprint.stack.mobile].filter(Boolean);
}

/** Starter ids whose baseline follows the modular composition contract. */
export function modularStarterIds(starters) {
  return starters.filter((starter) => starter.composition.model === 'modular').map((starter) => starter.id);
}
