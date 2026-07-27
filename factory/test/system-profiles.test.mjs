import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createArchitectureBlueprint, recommendSystemProfile } from '../cli/enistere.mjs';
import {
  canonicalSystemProfile,
  inferClientMode,
  inferSystemProfile,
  normalizeSystemArchitecture,
  SYSTEM_PROFILES,
  systemProfileDefaultArchitecture,
} from '../model/system-profiles.mjs';

describe('system profiles — canonical taxonomy', () => {
  it('exposes exactly the four use-case profiles', () => {
    assert.deepEqual(SYSTEM_PROFILES, [
      'backend-service',
      'product-platform',
      'distributed-platform',
      'service-ecosystem',
    ]);
  });

  it('migrates every historical peer profile at the input boundary', () => {
    assert.equal(canonicalSystemProfile('api'), 'backend-service');
    assert.equal(canonicalSystemProfile('monolith'), 'product-platform');
    assert.equal(canonicalSystemProfile('multi-client'), 'product-platform');
    assert.equal(canonicalSystemProfile('modular-distributed'), 'distributed-platform');
    assert.equal(canonicalSystemProfile('microservices'), 'service-ecosystem');
  });

  it('infers profile and client mode independently', () => {
    const backend = [{ id: 'api', kind: 'api' }];
    const product = [...backend, { id: 'web', kind: 'web' }, { id: 'mobile', kind: 'mobile' }];
    const distributed = [...backend, { id: 'ai', kind: 'api' }];
    assert.equal(inferSystemProfile(backend), 'backend-service');
    assert.equal(inferSystemProfile(product), 'product-platform');
    assert.equal(inferSystemProfile(distributed), 'distributed-platform');
    assert.equal(inferClientMode(product), 'multiple');
  });

  it('applies distributed defaults without pretending that generation is supported', () => {
    const architecture = normalizeSystemArchitecture(
      { profile: 'distributed-platform' },
      [{ id: 'core', kind: 'api' }, { id: 'ai', kind: 'api' }],
    );
    assert.equal(architecture.backend.style, 'distributed-services');
    assert.equal(architecture.deployment.coupling, 'partially-independent');
    assert.equal(architecture.data.ownership, 'bounded-context');
    assert.equal(architecture.operations.maturity, 'advanced');
  });

  it('emits complete defaults for every canonical profile', () => {
    for (const profile of SYSTEM_PROFILES) {
      const architecture = systemProfileDefaultArchitecture(profile);
      assert.equal(architecture.profile, profile);
      assert.ok(architecture.clients.mode);
      assert.ok(architecture.backend.style);
      assert.ok(architecture.deployment.coupling);
      assert.ok(architecture.data.ownership);
      assert.ok(architecture.communication.primary);
      assert.ok(architecture.operations.maturity);
    }
  });

  it('preserves the dimension implied by historical aliases', () => {
    const multiClient = normalizeSystemArchitecture(
      { profile: 'multi-client' },
      [{ id: 'api', kind: 'api' }, { id: 'web', kind: 'web' }, { id: 'mobile', kind: 'mobile' }],
    );
    assert.equal(multiClient.profile, 'product-platform');
    assert.equal(multiClient.clients.mode, 'multiple');
    const microservices = normalizeSystemArchitecture(
      { profile: 'microservices' },
      [{ id: 'a', kind: 'api' }, { id: 'b', kind: 'api' }],
    );
    assert.equal(microservices.profile, 'service-ecosystem');
    assert.equal(microservices.backend.style, 'microservices');
  });
});

describe('system profiles — deterministic recommendation', () => {
  it('selects the least-distributed profile matching the drivers', () => {
    assert.equal(recommendSystemProfile(new Set()).profile, 'backend-service');
    const product = recommendSystemProfile(new Set(['--clients=3']));
    assert.equal(product.profile, 'product-platform');
    assert.equal(product.architecture.clients.mode, 'multiple');
    assert.equal(recommendSystemProfile(new Set(['--apis=2'])).profile, 'distributed-platform');
    assert.equal(recommendSystemProfile(new Set(['--polyglot'])).profile, 'distributed-platform');
  });

  it('requires all autonomy drivers before recommending a service ecosystem', () => {
    assert.equal(recommendSystemProfile(new Set(['--teams=3', '--independent-deployments'])).profile, 'backend-service');
    assert.equal(recommendSystemProfile(new Set([
      '--teams=3',
      '--independent-deployments',
      '--isolated-data',
    ])).profile, 'service-ecosystem');
  });
});

describe('system profiles — system-first blueprint initialization', () => {
  it('requires the system profile before any runtime selection', () => {
    assert.throws(() => createArchitectureBlueprint('demo', new Set()), /init requires --architecture=/);
  });

  it('creates a backend service without official clients', () => {
    const blueprint = createArchitectureBlueprint(
      'payments',
      new Set(['--architecture=backend-service', '--api=fastapi']),
    );
    assert.deepEqual(blueprint.architecture, { profile: 'backend-service' });
    assert.deepEqual(blueprint.applications, [{ id: 'api', kind: 'api', runtime: 'fastapi' }]);
  });

  it('creates one product platform with multiple official clients', () => {
    const blueprint = createArchitectureBlueprint(
      'marketplace',
      new Set([
        '--architecture=product-platform',
        '--api=nestjs',
        '--web=nextjs,angular',
        '--mobile=react-native,flutter',
      ]),
    );
    assert.equal(blueprint.applications.filter((app) => app.kind === 'api').length, 1);
    assert.equal(blueprint.applications.filter((app) => app.kind !== 'api').length, 4);
  });

  it('creates distributed intent but does not claim generation support', () => {
    const blueprint = createArchitectureBlueprint(
      'distributed',
      new Set(['--architecture=distributed-platform']),
    );
    assert.equal(blueprint.applications.filter((app) => app.kind === 'api').length, 2);
    assert.equal(blueprint.architecture.profile, 'distributed-platform');
  });
});
