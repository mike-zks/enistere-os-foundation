import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { loadCapabilityManifests, validateCapabilityManifest } from '../engine/capabilities.mjs';

const FOUNDATION_ROOT = resolve(import.meta.dirname, '../..');

/** Minimal valid v2 manifest (all six targets declared). */
function baseManifest(overrides = {}) {
  return {
    schemaVersion: '2',
    id: 'auth',
    version: '1.0.0',
    requires: ['base'],
    responsibilities: ['login'],
    targets: {
      nestjs: { status: 'ready', mode: 'overlay' },
      spring: { status: 'ready', mode: 'overlay' },
      nextjs: { status: 'ready', mode: 'overlay' },
      angular: { status: 'planned' },
      'react-native': { status: 'not-applicable' },
      flutter: { status: 'planned' },
    },
    ...overrides,
  };
}

describe('Capability Contract v2', () => {
  it('accepts a minimal manifest', () => {
    assert.deepEqual(validateCapabilityManifest(baseManifest()), []);
  });

  it('accepts the optional rich fields (conflicts, provides, configuration, compatibility, migrations)', () => {
    assert.deepEqual(validateCapabilityManifest(baseManifest({
      conflicts: ['legacy-auth'],
      provides: { contracts: ['session', 'authentication'] },
      configuration: { provider: { type: 'enum', values: ['internal', 'keycloak', 'oidc'], default: 'internal' } },
      compatibility: { runtimes: { nestjs: '>=11', spring: '>=3.5' } },
      migrations: { from: ['0.9.0', '1.0.0'] },
    })), []);
  });

  it('rejects unknown top-level and target properties (closed contract)', () => {
    assert.ok(validateCapabilityManifest(baseManifest({ extra: true })).some((m) => m.includes('unknown property: extra')));
    const badTarget = baseManifest();
    badTarget.targets.nestjs = { status: 'ready', mode: 'overlay', extra: 1 };
    assert.ok(validateCapabilityManifest(badTarget).some((m) => m.includes('targets.nestjs.extra')));
  });

  it('enforces mode only when ready', () => {
    const readyNoMode = baseManifest();
    readyNoMode.targets.nestjs = { status: 'ready' };
    assert.ok(validateCapabilityManifest(readyNoMode).some((m) => m.includes('mode is required when ready')));
    const plannedWithMode = baseManifest();
    plannedWithMode.targets.angular = { status: 'planned', mode: 'overlay' };
    assert.ok(validateCapabilityManifest(plannedWithMode).some((m) => m.includes('mode is only allowed when ready')));
  });

  it('rejects malformed rich fields', () => {
    assert.ok(validateCapabilityManifest(baseManifest({ configuration: { provider: { type: 'enum' } } }))
      .some((m) => m.includes('values is required for enum')));
    assert.ok(validateCapabilityManifest(baseManifest({ compatibility: { runtimes: { deno: '>=1' } } }))
      .some((m) => m.includes('is not a known runtime')));
    assert.ok(validateCapabilityManifest(baseManifest({ migrations: { from: ['not-semver'] } }))
      .some((m) => m.includes('migrations.from must be an array of SemVer')));
    assert.ok(validateCapabilityManifest(baseManifest({ provides: { unknown: [] } }))
      .some((m) => m.includes('provides.unknown is not supported')));
  });

  // Backward compatibility: the real manifests on disk must satisfy the hardened
  // v2 contract unchanged (they use none of the optional fields).
  it('validates the four shipped manifests unchanged', async () => {
    await assert.doesNotReject(loadCapabilityManifests(FOUNDATION_ROOT));
  });
});
