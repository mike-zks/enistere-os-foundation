import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { recommendSystemProfile } from '../cli/enistere.mjs';
import {
  canonicalSystemProfile,
  inferClientMode,
  inferSystemProfile,
  normalizeSystemArchitecture,
  SYSTEM_PROFILES,
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
});

describe('system profiles — deterministic recommendation', () => {
  it('selects the least-distributed profile matching the drivers', () => {
    assert.equal(recommendSystemProfile(new Set()).profile, 'backend-service');
    assert.equal(recommendSystemProfile(new Set(['--clients=3'])).profile, 'product-platform');
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
