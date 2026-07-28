import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { buildCapabilityMatrix, loadCapabilityManifests } from '../engine/capabilities.mjs';
import { getTargetAdapter } from '../engine/target-adapters.mjs';
import { loadStarterManifests, STARTER_IDS, validateManifestConsistency, validateStarterManifest } from '../engine/starters.mjs';

const root = resolve(import.meta.dirname, '../..');

it('loads seven independent starters with Platform Baseline v2 contracts', async () => {
  const manifests = await loadStarterManifests(root);
  assert.deepEqual(manifests.map((item) => item.id), STARTER_IDS);
  assert.ok(manifests.every((item) => item.schemaVersion === '2'));
  assert.ok(manifests.every((item) => item.baseline.contractVersion === '2.0.0'));
  assert.ok(manifests.every((item) => item.baseline.familyContract === `${item.kind}/2.0.0`));
  assert.ok(manifests.every((item) => item.composition.base === undefined));
  assert.ok(manifests.every((item) => item.composition.baseSource === undefined));
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

it('rejects the legacy baseSource indirection', async () => {
  const [manifest] = await loadStarterManifests(root);
  const legacy = structuredClone(manifest);
  legacy.composition.baseSource = `starters/${manifest.id}/base`;
  assert.ok(validateStarterManifest(legacy).some(
    (issue) => issue.includes('composition.baseSource is forbidden'),
  ));
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

describe('Angular composition seams', () => {
  it('lets a capability contribute providers, routes and interceptors', () => {
    const angular = getTargetAdapter('angular');
    // Angular was a declared target with an empty adapter: no integration kind,
    // no composition. That is why no capability could target it at all — the
    // gap ADR-074 measured was a missing seam, not missing capability code.
    assert.deepEqual(
      Object.keys(angular.integrationKinds).sort(),
      ['angular.http-interceptor', 'angular.provider', 'angular.route'],
    );
    assert.deepEqual(
      angular.composition.map((entry) => entry.destination),
      [
        'src/app/core/composition/capability-providers.ts',
        'src/app/core/composition/capability-routes.ts',
        'src/app/core/composition/capability-interceptors.ts',
      ],
    );
  });

  it('orders contributed routes deterministically and refuses a collision', () => {
    const render = getTargetAdapter('angular').composition
      .find((entry) => entry.kinds.includes('angular.route')).render;

    const output = render([
      { kind: 'angular.route', path: 'z', importPath: './z', symbol: 'Z', title: 'Z', order: 2 },
      { kind: 'angular.route', path: 'a', importPath: './a', symbol: 'A', title: 'A', order: 1 },
    ]);
    // Two capabilities resolved in either order must yield the same file.
    assert.ok(output.indexOf("path: 'a'") < output.indexOf("path: 'z'"));

    assert.throws(
      () => render([
        { kind: 'angular.route', path: 'same', importPath: './a', symbol: 'A', order: 1 },
        { kind: 'angular.route', path: 'same', importPath: './b', symbol: 'B', order: 2 },
      ]),
      /two capabilities contribute the Angular route "same"/,
    );
  });

  it('keeps the baseline seams empty and consumed by the app', async () => {
    const seams = resolve(root, 'starters/angular/src/app');
    for (const seam of ['capability-providers', 'capability-routes', 'capability-interceptors']) {
      const source = await readFile(join(seams, 'core/composition', `${seam}.ts`), 'utf8');
      assert.match(source, /\[\]/, `${seam} must ship empty`);
    }
    // A seam nothing consumes is decorative: assert the app actually wires them.
    const config = await readFile(join(seams, 'app.config.ts'), 'utf8');
    assert.match(config, /CAPABILITY_INTERCEPTORS/);
    assert.match(config, /CAPABILITY_PROVIDERS/);
    const routes = await readFile(join(seams, 'app.routes.ts'), 'utf8');
    assert.match(routes, /CAPABILITY_ROUTES/);
  });
});
