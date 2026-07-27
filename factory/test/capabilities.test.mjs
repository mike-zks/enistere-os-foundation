import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import {
  discoverCapabilityIds,
  loadCapabilityManifests,
  resolveCapabilityGraph,
  validateCapabilityManifest,
  validateCapabilityRegistry,
} from '../engine/capabilities.mjs';

const FOUNDATION_ROOT = resolve(import.meta.dirname, '../..');

function readyTarget(runtime) {
  return {
    status: 'ready',
    mode: 'overlay',
    adapter: { id: runtime, version: '1.0.0' },
    contracts: [],
    primitives: [],
    deploymentModes: ['embedded'],
    migrations: [],
    conformance: [`sample-${runtime}-suite`],
  };
}

function manifest(id, overrides = {}) {
  const ready = readyTarget('nestjs');
  return {
    schemaVersion: '2',
    id,
    version: '1.0.0',
    requires: [],
    conflicts: [],
    responsibilities: ['sample'],
    contracts: [],
    primitives: [],
    configuration: {},
    targets: {
      nestjs: ready,
      spring: { status: 'unsupported' },
      fastapi: { status: 'unsupported' },
      nextjs: { status: 'unsupported' },
      angular: { status: 'unsupported' },
      'react-native': { status: 'unsupported' },
      flutter: { status: 'unsupported' },
    },
    migrations: [],
    conformance: [{
      id: ready.conformance[0],
      target: 'nestjs',
      level: 'contract',
      evidence: 'repository-test',
    }],
    ...overrides,
  };
}

describe('Capability Manifest v2', () => {
  it('loads the directory-driven registry and validates all repository evidence', async () => {
    assert.deepEqual(await discoverCapabilityIds(FOUNDATION_ROOT), ['auth', 'files', 'rbac']);
    const manifests = await loadCapabilityManifests(FOUNDATION_ROOT);
    assert.deepEqual(manifests.map((item) => item.id), ['auth', 'files', 'rbac']);
    const filesClosure = await loadCapabilityManifests(FOUNDATION_ROOT, ['files']);
    assert.deepEqual(filesClosure.map((item) => item.id), ['auth', 'rbac', 'files']);
  });

  it('requires the complete closed contract', () => {
    assert.deepEqual(validateCapabilityManifest(manifest('sample')), []);
    const missing = manifest('sample');
    delete missing.primitives;
    assert.ok(validateCapabilityManifest(missing).includes('primitives is required'));
    assert.ok(validateCapabilityManifest({ ...manifest('sample'), provider: 'minio' })
      .includes('unknown property: provider'));
  });

  it('requires adapter, deployment, migration and conformance declarations on ready targets', () => {
    const invalid = manifest('sample');
    delete invalid.targets.nestjs.adapter;
    delete invalid.targets.nestjs.conformance;
    const issues = validateCapabilityManifest(invalid);
    assert.ok(issues.includes('targets.nestjs.adapter is required when ready'));
    assert.ok(issues.some((issue) => issue.startsWith('targets.nestjs.conformance')));
  });

  it('keeps primitive requirements provider-neutral', () => {
    const value = manifest('sample', {
      primitives: [{
        id: 'content',
        kind: 'content-repository',
        requirement: 'required',
        purposes: ['records'],
      }],
    });
    value.targets.nestjs.primitives = ['content'];
    assert.deepEqual(validateCapabilityManifest(value), []);
  });
});

describe('Capability Graph v2', () => {
  it('auto-closes files deterministically and traces every inclusion edge', async () => {
    const manifests = await loadCapabilityManifests(FOUNDATION_ROOT);
    const graph = resolveCapabilityGraph(['files'], manifests);
    assert.deepEqual(graph.requested, ['files']);
    assert.deepEqual(graph.order, ['auth', 'rbac', 'files']);
    assert.deepEqual(graph.autoIncluded, ['auth', 'rbac']);
    assert.deepEqual(graph.edges, [
      { from: 'files', to: 'auth' },
      { from: 'files', to: 'rbac' },
      { from: 'rbac', to: 'auth' },
    ]);
    assert.deepEqual(graph.issues, []);
    assert.deepEqual(resolveCapabilityGraph(['files', 'auth'], manifests).order, graph.order);
  });

  it('rejects cycles from the declared graph rather than an engine-side rule', () => {
    const alpha = manifest('alpha', { requires: ['beta'] });
    const beta = manifest('beta', { requires: ['alpha'] });
    assert.ok(validateCapabilityRegistry([alpha, beta])
      .some((issue) => issue.includes('alpha -> beta -> alpha')));
  });

  it('requires conflicts to be symmetric, explained and enforced', () => {
    const reason = 'Both capabilities own the same exclusive session protocol.';
    const alpha = manifest('alpha', { conflicts: [{ id: 'beta', reason }] });
    const beta = manifest('beta');
    assert.ok(validateCapabilityRegistry([alpha, beta])
      .includes('alpha conflict with beta is not symmetric'));

    beta.conflicts = [{ id: 'alpha', reason }];
    assert.deepEqual(validateCapabilityRegistry([alpha, beta]), []);
    assert.deepEqual(resolveCapabilityGraph(['beta', 'alpha'], [alpha, beta]).issues, [
      `capability conflict alpha <-> beta: ${reason}`,
    ]);
  });

  it('rejects a target adapter contract that differs from the active registry', () => {
    const invalid = manifest('sample');
    invalid.targets.nestjs.adapter.version = '2.0.0';
    assert.ok(validateCapabilityRegistry([invalid])
      .includes('sample/nestjs requires adapter 2.0.0 but registry provides 1.0.0'));
  });
});
