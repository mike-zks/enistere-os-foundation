import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CAPABILITY_DEPLOYMENT_MODES,
  CAPABILITY_STATUSES,
  INFRASTRUCTURE_PRIMITIVE_KINDS,
  discoverCapabilityIds,
  loadCapabilityManifests,
  resolveCapabilityGraph,
  validateCapabilityManifest,
  validateCapabilityRegistry,
} from '../engine/capabilities.mjs';
import { capabilitySchema, validateManifestSchema } from '../engine/capability-schema.mjs';

const REAL_MANIFESTS = new Map();
function realManifest(id) {
  if (!REAL_MANIFESTS.has(id)) {
    REAL_MANIFESTS.set(id, JSON.parse(
      readFileSync(resolve(FOUNDATION_ROOT, 'capabilities', id, 'capability.json'), 'utf8'),
    ));
  }
  return REAL_MANIFESTS.get(id);
}

const FOUNDATION_ROOT = resolve(import.meta.dirname, '../..');

function readyTarget(runtime) {
  return {
    status: 'ready',
    mode: 'overlay',
    adapter: { id: runtime, version: '1.0.0' },
    responsibilities: ['sample'],
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

  it('makes a ready target state which responsibilities it actually holds', () => {
    const missing = manifest('sample');
    delete missing.targets.nestjs.responsibilities;
    assert.ok(validateCapabilityManifest(missing)
      .includes('targets.nestjs.responsibilities is required when ready'));

    const empty = manifest('sample');
    empty.targets.nestjs.responsibilities = [];
    assert.ok(validateCapabilityManifest(empty)
      .includes('targets.nestjs.responsibilities must not be empty'));

    // A target cannot claim a responsibility the capability never declared.
    const foreign = manifest('sample');
    foreign.targets.nestjs.responsibilities = ['sample', 'invented'];
    assert.ok(validateCapabilityManifest(foreign)
      .includes('targets.nestjs.responsibilities references unknown invented'));

    // Partial coverage is legitimate — it just has to be stated.
    const partial = manifest('sample');
    partial.responsibilities = ['sample', 'extra'];
    partial.targets.nestjs.responsibilities = ['sample'];
    assert.deepEqual(validateCapabilityManifest(partial), []);
  });

  it('treats capability.schema.json as the executed contract, not documentation', () => {
    // The defect this replaced: the schema existed, was maintained, and nothing
    // ran it — the real rules lived in a hand-written twin (ADR-072).
    assert.equal(capabilitySchema.$schema, 'https://json-schema.org/draft/2020-12/schema');
    for (const real of ['auth', 'rbac', 'files']) {
      assert.deepEqual(validateManifestSchema(realManifest(real)), [], `${real} must satisfy the schema`);
    }

    // The engine's vocabulary is READ from the schema rather than redeclared, so
    // the two cannot drift apart again.
    assert.deepEqual(
      [...CAPABILITY_STATUSES],
      capabilitySchema.$defs.target.properties.status.enum,
    );
    assert.deepEqual(
      [...INFRASTRUCTURE_PRIMITIVE_KINDS],
      capabilitySchema.$defs.primitive.properties.kind.enum,
    );
    assert.deepEqual(
      [...CAPABILITY_DEPLOYMENT_MODES],
      capabilitySchema.$defs.target.properties.deploymentModes.items.enum,
    );
  });

  it('rejects every structural violation through the schema alone', () => {
    const cases = [
      ['schemaVersion', (m) => { m.schemaVersion = '1'; }],
      ['id', (m) => { m.id = 'Bad_ID'; }],
      ['version', (m) => { m.version = 'v1'; }],
      ['requires', (m) => { m.requires = ['auth', 'auth']; }],
      ['conflicts[0].reason', (m) => { m.conflicts = [{ id: 'other' }]; }],
      ['contracts[0].kind', (m) => { m.contracts = [{ id: 'c', version: '1.0.0', kind: 'grpc' }]; }],
      ['primitives[0].requirement', (m) => {
        m.primitives = [{ id: 'p', kind: 'cache', requirement: 'mandatory', purposes: ['x'] }];
      }],
      ['migrations[0].order', (m) => {
        m.migrations = [{
          id: 'mig', target: 'nestjs', kind: 'database',
          strategy: 'additive', path: 'targets/nestjs/x.sql', order: -1,
        }];
      }],
      ['configuration', (m) => { m.configuration = { 'Bad Name': { type: 'string' } }; }],
      ['targets.nestjs.deploymentModes', (m) => { m.targets.nestjs.deploymentModes = ['serverless']; }],
      ['targets.nestjs.adapter.version', (m) => { m.targets.nestjs.adapter.version = 'latest'; }],
      ['targets.fastapi.status', (m) => { m.targets.fastapi.status = 'maybe'; }],
      // A non-ready target must not carry ready-only fields.
      ['targets.angular', (m) => { m.targets.angular = { status: 'planned', mode: 'overlay' }; }],
    ];
    for (const [label, mutate] of cases) {
      const invalid = manifest('sample');
      mutate(invalid);
      assert.ok(
        validateManifestSchema(invalid).length > 0,
        `${label} must be refused by the schema itself`,
      );
    }
  });

  it('keeps in code only what a JSON Schema cannot express', () => {
    // Cross-references: identifiers pointing at other parts of the same document.
    const foreignAdapter = manifest('sample');
    foreignAdapter.targets.nestjs.adapter.id = 'spring';
    assert.ok(validateCapabilityManifest(foreignAdapter)
      .includes('targets.nestjs.adapter.id must be nestjs'));

    const unknownSuite = manifest('sample');
    unknownSuite.targets.nestjs.conformance = ['never-declared'];
    assert.ok(validateCapabilityManifest(unknownSuite)
      .includes('targets.nestjs.conformance references unknown never-declared'));

    const duplicated = manifest('sample');
    duplicated.contracts = [
      { id: 'twin', version: '1.0.0', kind: 'api' },
      { id: 'twin', version: '2.0.0', kind: 'api' },
    ];
    assert.ok(validateCapabilityManifest(duplicated).includes('contracts must have unique ids'));

    const strayPath = manifest('sample');
    strayPath.migrations = [{
      id: 'mig', target: 'nestjs', kind: 'database',
      strategy: 'additive', path: 'targets/spring/x.sql', order: 1,
    }];
    strayPath.targets.nestjs.migrations = ['mig'];
    assert.ok(validateCapabilityManifest(strayPath)
      .includes('migrations[0].path must belong to target nestjs'));

    const badDefault = manifest('sample');
    badDefault.configuration = { mode: { type: 'enum', values: ['a', 'b'], default: 'c' } };
    assert.ok(validateCapabilityManifest(badDefault)
      .includes('configuration.mode.default must be one of values'));
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
