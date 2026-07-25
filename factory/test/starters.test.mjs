import { it } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { buildCapabilityMatrix, loadCapabilityManifests } from '../engine/capabilities.mjs';
import { loadStarterManifests, STARTER_IDS, validateManifestConsistency, validateStarterManifest } from '../engine/starters.mjs';

const root = resolve(import.meta.dirname, '../..');

it('loads seven independent starters with Platform Baseline v2 contracts', async () => {
  const manifests = await loadStarterManifests(root);
  assert.deepEqual(manifests.map((item) => item.id), STARTER_IDS);
  assert.ok(manifests.every((item) => item.schemaVersion === '2'));
  assert.ok(manifests.every((item) => item.baseline.contractVersion === '2.0.0'));
  assert.ok(manifests.every((item) => item.baseline.familyContract === `${item.kind}/2.0.0`));
  assert.ok(manifests.every((item) => item.composition.base === undefined));
  const modular = manifests.filter((item) => item.composition.model === 'modular');
  assert.deepEqual(modular.map((item) => item.id), ['nestjs', 'spring', 'fastapi', 'nextjs', 'angular', 'react-native', 'flutter']);
  assert.ok(modular.every((item) => item.composition.readyCapabilities.length === 0 || item.composition.readyCapabilities.includes('auth')));
  assert.ok(manifests.filter((item) => item.composition.model !== 'modular').every((item) => item.composition.readyCapabilities.length === 0));
  assert.equal(manifests.filter((item) => item.kind === 'api').length, 3);
  assert.equal(manifests.filter((item) => item.kind === 'web').length, 2);
  assert.equal(manifests.filter((item) => item.kind === 'mobile').length, 2);
});

it('cross-validates starter and capability declarations', async () => {
  const starters = await loadStarterManifests(root);
  const capabilities = await loadCapabilityManifests(root);
  assert.deepEqual(validateManifestConsistency(starters, capabilities), []);
});

it('rejects the legacy capability-style base classification', async () => {
  const [manifest] = await loadStarterManifests(root);
  const legacy = structuredClone(manifest);
  legacy.composition.base = 'built-in';
  assert.ok(validateStarterManifest(legacy).some((issue) => issue.includes('composition.base is forbidden')));
});

it('reports a truthful target support matrix', async () => {
  const matrix = buildCapabilityMatrix(await loadCapabilityManifests(root));
  assert.equal(matrix.auth.nextjs, 'ready');
  assert.equal(matrix.auth.spring, 'ready');
  assert.equal(matrix.rbac.nestjs, 'ready');
  assert.equal(matrix.rbac.nextjs, 'ready');
  assert.equal(matrix.rbac['react-native'], 'not-applicable');
  assert.equal(matrix.rbac.spring, 'ready');
  assert.equal(matrix.files.nestjs, 'ready');
  assert.equal(matrix.files.nextjs, 'ready');
  assert.equal(matrix.files['react-native'], 'ready');
  assert.equal(matrix.files.spring, 'ready');
});
