import { it } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { buildCapabilityMatrix, loadCapabilityManifests } from '../engine/capabilities.mjs';
import { loadStarterManifests, STARTER_IDS, validateManifestConsistency } from '../engine/starters.mjs';

const root = resolve(import.meta.dirname, '../..');

it('loads six independent starters using manifest schema v2', async () => {
  const manifests = await loadStarterManifests(root);
  assert.deepEqual(manifests.map((item) => item.id), STARTER_IDS);
  assert.ok(manifests.every((item) => item.schemaVersion === '2'));
  assert.ok(manifests.every((item) => item.composition.base === 'built-in'));
  const modular = manifests.filter((item) => item.composition.model === 'modular');
  assert.deepEqual(modular.map((item) => item.id), ['nestjs', 'nextjs', 'react-native']);
  assert.ok(modular.every((item) => item.composition.readyCapabilities.includes('auth')));
  assert.ok(manifests.filter((item) => item.composition.model !== 'modular').every((item) => item.composition.readyCapabilities.length === 0));
  assert.equal(manifests.filter((item) => item.kind === 'api').length, 2);
  assert.equal(manifests.filter((item) => item.kind === 'web').length, 2);
  assert.equal(manifests.filter((item) => item.kind === 'mobile').length, 2);
});

it('cross-validates starter and capability declarations', async () => {
  const starters = await loadStarterManifests(root);
  const capabilities = await loadCapabilityManifests(root);
  assert.deepEqual(validateManifestConsistency(starters, capabilities), []);
});

it('reports a truthful target support matrix', async () => {
  const matrix = buildCapabilityMatrix(await loadCapabilityManifests(root));
  assert.equal(matrix.base.nestjs, 'ready');
  assert.equal(matrix.base.flutter, 'ready');
  assert.equal(matrix.auth.nextjs, 'ready');
  assert.equal(matrix.auth.spring, 'planned');
  assert.equal(matrix.rbac.nestjs, 'planned');
  assert.equal(matrix.files['react-native'], 'planned');
});
