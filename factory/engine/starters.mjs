import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const STARTER_IDS = Object.freeze(['nestjs', 'spring', 'nextjs', 'angular', 'react-native', 'flutter']);
const KINDS = new Set(['api', 'web', 'mobile']);
const COMMANDS = ['install', 'dev', 'test', 'build', 'verify'];
const SLOTS = ['base', 'auth', 'rbac', 'files', 'audit', 'notifications', 'observability'];

export function validateStarterManifest(value) {
  const issues = [];
  if (value?.schemaVersion !== '1') issues.push('schemaVersion must be 1');
  if (!STARTER_IDS.includes(value?.id)) issues.push('id is not registered');
  if (!KINDS.has(value?.kind)) issues.push('kind is invalid');
  if (typeof value?.framework !== 'string' || !value.framework) issues.push('framework is required');
  for (const command of COMMANDS) if (!Array.isArray(value?.commands?.[command]) || value.commands[command].length === 0) issues.push(`commands.${command} is required`);
  for (const slot of SLOTS) if (!value?.capabilitySlots?.includes(slot)) issues.push(`capability slot missing: ${slot}`);
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
