import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const IMPLEMENTED_CAPABILITIES = Object.freeze(['base', 'auth', 'rbac', 'files']);

export async function loadCapabilityManifests(repoRoot, selected) {
  const manifests = [];
  for (const id of selected) {
    if (!IMPLEMENTED_CAPABILITIES.includes(id)) continue;
    const value = JSON.parse(await readFile(join(repoRoot, 'capabilities', id, 'capability.json'), 'utf8'));
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
  return [...new Set(issues)];
}
