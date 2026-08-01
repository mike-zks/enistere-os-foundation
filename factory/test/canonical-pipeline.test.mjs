import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { normalizeBlueprint } from '../blueprint/normalize.mjs';
import { validateCanonicalSystem } from '../blueprint/validate.mjs';
import { resolveSystem } from '../engine/resolver.mjs';
import { buildPlan } from '../model/generation-plan.mjs';
import { buildGenerationPlan } from '../engine/plan.mjs';
import { CSM_DIAGNOSTIC_CODES, hasErrors } from '../model/diagnostics.mjs';
import { loadStarterManifests, modularStarterIds } from '../engine/starters.mjs';
import { loadCapabilityManifests } from '../engine/capabilities.mjs';
import { materializeProfileInput } from '../engine/profiles.mjs';

const root = resolve(import.meta.dirname, '../..');

function blueprint({ stack, applications, capabilities = ['base'], architecture, communications = [] } = {}) {
  const bp = {
    version: '1', project: { name: 'Sample', slug: 'sample' }, topology: 'monorepo',
    designSystem: true, domain: { entities: [] }, capabilities, deployment: { environments: ['local'] },
  };
  if (architecture) bp.architecture = architecture;
  bp.communications = communications;
  if (applications) bp.applications = applications; else bp.stack = stack ?? { api: 'nestjs', web: null, mobile: null };
  return bp;
}

let starters;
let registry;
before(async () => {
  starters = await loadStarterManifests(root);
});
async function registryFor(caps) {
  return { starters, capabilityManifests: await loadCapabilityManifests(root, caps), modularStarters: modularStarterIds(starters) };
}

describe('canonical pipeline — single chain blueprint → CSM → resolved → plan', () => {
  it('runs the whole chain for every base composition', async () => {
    for (const stack of [{ api: 'nestjs' }, { api: 'spring', web: 'angular' }, { api: 'nestjs', web: 'nextjs', mobile: 'flutter' }]) {
      const bp = blueprint({ stack });
      const csm = normalizeBlueprint(bp);
      assert.deepEqual(validateCanonicalSystem(csm), []);
      const resolved = resolveSystem(csm, await registryFor(['base']));
      const plan = buildPlan(resolved);
      assert.equal(plan.systemDigest, csm.source.digest);
      assert.equal(plan.resolutionDigest, resolved.resolutionDigest);
      assert.equal(plan.applications.length, csm.applications.length);
      assert.equal(plan.support.level, 'ready');
      assert.equal(plan.architectureProfile.generation, 'GENERATABLE');
      assert.equal(plan.architectureProfile.generatable, true);
    }
  });

  it('buildGenerationPlan orchestrates the same result', async () => {
    const bp = blueprint({ stack: { api: 'nestjs', web: 'nextjs' }, capabilities: ['base', 'auth'] });
    const plan = buildGenerationPlan(bp, await registryFor(['base', 'auth']));
    assert.deepEqual(plan.applications.map((a) => a.appDir), ['apps/api', 'apps/web']);
    assert.equal(plan.profile?.id, 'nestjs-next-auth');
  });
});

describe('canonical pipeline — multi-application strategy', () => {
  it('supports multi-surface (two web apps on one API)', async () => {
    const bp = blueprint({ applications: [
      { id: 'api', kind: 'api', runtime: 'nestjs' },
      { id: 'shop-web', kind: 'web', runtime: 'nextjs', consumes: ['api'] },
      { id: 'admin-web', kind: 'web', runtime: 'nextjs', consumes: ['api'] },
    ] });
    const csm = normalizeBlueprint(bp);
    assert.deepEqual(validateCanonicalSystem(csm), []);
    const plan = buildPlan(resolveSystem(csm, await registryFor(['base'])));
    assert.deepEqual(plan.applications.map((a) => a.appDir), ['apps/api', 'apps/shop-web', 'apps/admin-web']);
    assert.equal(plan.architectureProfile.id, 'product-platform');
    assert.equal(plan.architectureProfile.generatable, true);
    assert.equal(plan.compositionPreset, null);
  });

  it('requires explicit ownership and communication contracts for multiple APIs', () => {
    const bp = blueprint({ applications: [
      { id: 'api-a', kind: 'api', runtime: 'nestjs' },
      { id: 'api-b', kind: 'api', runtime: 'spring' },
    ] });
    const diagnostics = validateCanonicalSystem(normalizeBlueprint(bp));
    assert.ok(diagnostics.some((d) => d.code === CSM_DIAGNOSTIC_CODES.INVALID_OWNERSHIP));
    assert.ok(diagnostics.some((d) => d.code === CSM_DIAGNOSTIC_CODES.INCOHERENT_COMMUNICATION_GRAPH));
  });

  it('generates only the evidence-bound Spring + NestJS distributed slice', async () => {
    const bp = blueprint({
      applications: [
        { id: 'identity', kind: 'api', runtime: 'spring', ownership: { team: 'identity-team', domains: ['identity'] } },
        { id: 'business', kind: 'api', runtime: 'nestjs', consumes: ['identity'], ownership: { team: 'business-team', domains: ['business'] } },
      ],
      architecture: { profile: 'distributed-platform' },
      communications: [{
        id: 'business-to-identity',
        from: 'business',
        to: 'identity',
        mode: 'synchronous',
        protocol: 'http',
        contract: 'identity-api.v1',
        timeoutMs: 2000,
        maxAttempts: 2,
        identity: 'workload',
        failurePolicy: 'fail-fast',
      }],
    });
    const csm = normalizeBlueprint(bp);
    assert.equal(csm.architecture.profile, 'distributed-platform');
    assert.equal(hasErrors(validateCanonicalSystem(csm)), false);
    const plan = buildPlan(resolveSystem(csm, await registryFor(['base'])));
    assert.equal(plan.architecture.profile, 'distributed-platform');
    assert.deepEqual(plan.architectureProfile, {
      id: 'distributed-platform',
      status: 'GENERATABLE',
      representation: 'IMPLEMENTED',
      generation: 'GENERATABLE',
      generationScope: 'proven Spring + NestJS two-authority slice only',
      generatable: true,
    });
    assert.equal(plan.compositionPreset, null);
    assert.equal(plan.profile, null);
    assert.equal(plan.support.level, 'ready');
    assert.equal(plan.diagnostics.length, 0);
    assert.deepEqual(plan.communications.map((communication) => communication.id), ['business-to-identity']);
    assert.deepEqual(plan.applications.map((application) => application.ownership.team), ['identity-team', 'business-team']);
    assert.deepEqual(plan.deploymentPlan.order, ['identity', 'business']);
    assert.deepEqual(plan.deploymentPlan.rollbackOrder, ['business', 'identity']);
  });

  it('keeps an unproven distributed runtime pair represented but blocked', async () => {
    const bp = blueprint({
      applications: [
        { id: 'identity', kind: 'api', runtime: 'spring', ownership: { team: 'identity-team', domains: ['identity'] } },
        { id: 'insight', kind: 'api', runtime: 'fastapi', consumes: ['identity'], ownership: { team: 'insight-team', domains: ['insight'] } },
      ],
      architecture: { profile: 'distributed-platform' },
      communications: [{
        id: 'insight-to-identity',
        from: 'insight',
        to: 'identity',
        mode: 'synchronous',
        protocol: 'http',
        contract: 'identity-api.v1',
        timeoutMs: 2000,
        maxAttempts: 2,
        identity: 'workload',
        failurePolicy: 'degrade',
      }],
    });
    const csm = normalizeBlueprint(bp);
    assert.equal(hasErrors(validateCanonicalSystem(csm)), false);
    const plan = buildPlan(resolveSystem(csm, await registryFor(['base'])));
    assert.equal(plan.architectureProfile.generation, 'GENERATABLE');
    assert.equal(plan.architectureProfile.generatable, false);
    assert.equal(plan.support.level, 'blocked');
    assert.ok(plan.diagnostics.some((diagnostic) =>
      diagnostic.code === 'RESOLUTION_TOPOLOGY_NOT_GENERATABLE'));
  });

  it('resolves one capability through each backend authority adapter before generation support', async () => {
    const bp = blueprint({
      applications: [
        {
          id: 'identity',
          kind: 'api',
          runtime: 'spring',
          ownership: { team: 'identity-team', domains: ['identity'] },
        },
        {
          id: 'engagement',
          kind: 'api',
          runtime: 'nestjs',
          consumes: ['identity'],
          ownership: { team: 'engagement-team', domains: ['engagement'] },
        },
      ],
      architecture: { profile: 'distributed-platform' },
      capabilities: ['auth'],
      communications: [{
        id: 'engagement-to-identity',
        from: 'engagement',
        to: 'identity',
        mode: 'synchronous',
        protocol: 'http',
        contract: 'identity-api.v1',
        timeoutMs: 2000,
        maxAttempts: 2,
        identity: 'workload',
        failurePolicy: 'fail-fast',
      }],
    });
    const plan = buildGenerationPlan(bp, await registryFor());
    assert.equal(plan.support.level, 'blocked', 'distributed capabilities are not claimed generatable yet');
    assert.equal(plan.capabilityTargets.auth.byApplication.identity.adapter.id, 'spring');
    assert.equal(plan.capabilityTargets.auth.byApplication.engagement.adapter.id, 'nestjs');
    assert.deepEqual(
      plan.applications.map((application) =>
        application.resolvedCapabilities.map((capability) => capability.adapter.id)),
      [['spring'], ['nestjs']],
    );
  });
});

describe('canonical pipeline — target resolution', () => {
  it('resolves capability targets rather than applying to all applications', async () => {
    // RBAC is not-applicable on React Native: the mobile app is a not-applicable
    // target, the API is a resolved target.
    const bp = blueprint({ stack: { api: 'nestjs', web: 'nextjs', mobile: 'react-native' }, capabilities: ['base', 'auth', 'rbac'] });
    const plan = buildGenerationPlan(bp, await registryFor(['base', 'auth', 'rbac']));
    const rbac = plan.capabilityTargets.rbac;
    assert.ok(rbac.resolved.includes('api'));
    assert.ok(rbac.notApplicable.includes('mobile'));
    assert.ok(!rbac.resolved.includes('mobile') || rbac.notApplicable.includes('mobile'));
  });

  it('marks a blocked composition as not ready', async () => {
    // Files on Flutter is planned → blocked. What is under test is the blocked
    // level, not the capability that happens to be unfinished this week.
    const bp = blueprint({ stack: { api: 'nestjs', mobile: 'flutter' }, capabilities: ['base', 'auth', 'rbac', 'files'] });
    const plan = buildGenerationPlan(bp, await registryFor(['base', 'auth', 'rbac', 'files']));
    assert.equal(plan.support.level, 'blocked');
  });
});

describe('canonical pipeline — deep immutability', () => {
  it('freezes the CSM, the ResolvedSystem and the GenerationPlan deeply', async () => {
    const csm = normalizeBlueprint(blueprint({ stack: { api: 'nestjs', web: 'nextjs' } }));
    const resolved = resolveSystem(csm, await registryFor(['base']));
    const plan = buildPlan(resolved);
    assert.throws(() => { csm.metadata.name = 'x'; });
    assert.throws(() => { csm.applications.push({}); });
    assert.throws(() => { resolved.applications[0].appDir = 'x'; });
    assert.throws(() => { plan.applications.push({}); });
    assert.throws(() => { plan.stack.api = 'x'; });
  });
});

describe('canonical pipeline — determinism of the three digests', () => {
  it('produces identical systemDigest, resolutionDigest and planDigest for identical input', async () => {
    const reg = await registryFor(['base', 'auth']);
    const make = () => buildPlan(resolveSystem(normalizeBlueprint(blueprint({ stack: { api: 'nestjs' }, capabilities: ['base', 'auth'] })), reg));
    const a = make();
    const b = make();
    assert.equal(a.systemDigest, b.systemDigest);
    assert.equal(a.resolutionDigest, b.resolutionDigest);
    assert.equal(a.planDigest, b.planDigest);
    assert.notEqual(a.systemDigest, a.resolutionDigest);
    assert.notEqual(a.resolutionDigest, a.planDigest);
  });
});

describe('canonical pipeline — profiles are presets', () => {
  it('materializes a profile into a blueprint input consumed by the normal chain', async () => {
    const input = materializeProfileInput('nestjs-auth');
    assert.equal(input.version, '1');
    assert.deepEqual(input.capabilities, ['auth']);
    const plan = buildGenerationPlan(input, await registryFor(['auth']));
    assert.equal(plan.profile?.id, 'nestjs-auth');
    assert.equal(plan.compositionPreset?.id, 'nestjs-auth');
    assert.equal(plan.architectureProfile.id, 'backend-service');
  });
});
