import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { validateBlueprint } from '../engine/blueprint.mjs';
import { buildGenerationPlan } from '../engine/plan.mjs';
import { resolveApplications, resolveStack } from '../engine/applications.mjs';
import { loadStarterManifests, modularStarterIds } from '../engine/starters.mjs';

const FOUNDATION_ROOT = resolve(import.meta.dirname, '../..');

function blueprint(surface) {
  return {
    version: '1',
    project: { name: 'Canonical', slug: 'canonical' },
    topology: 'monorepo',
    designSystem: true,
    domain: { entities: [] },
    capabilities: ['base'],
    deployment: { environments: ['local'] },
    ...surface,
  };
}

const STACK = blueprint({ stack: { api: 'nestjs', web: 'nextjs', mobile: 'react-native' } });
const APPS = blueprint({
  applications: [
    { id: 'api', kind: 'api', runtime: 'nestjs' },
    { id: 'web', kind: 'web', runtime: 'nextjs' },
    { id: 'mobile', kind: 'mobile', runtime: 'react-native' },
  ],
});

describe('SystemBlueprint canonical model (Contrat 1)', () => {
  it('desugars stack into the canonical applications model', () => {
    assert.deepEqual(resolveApplications(STACK), [
      { id: 'api', kind: 'api', runtime: 'nestjs', slot: 'api' },
      { id: 'web', kind: 'web', runtime: 'nextjs', slot: 'web' },
      { id: 'mobile', kind: 'mobile', runtime: 'react-native', slot: 'mobile' },
    ]);
    // A stack-based blueprint passes its own stack through unchanged.
    assert.equal(resolveStack(STACK), STACK.stack);
    // An applications-based blueprint synthesizes the identical slot view.
    assert.deepEqual(resolveStack(APPS), { api: 'nestjs', web: 'nextjs', mobile: 'react-native' });
  });

  it('accepts both surfaces', () => {
    assert.deepEqual(validateBlueprint(STACK), []);
    assert.deepEqual(validateBlueprint(APPS), []);
  });

  // The core socle guarantee: the two surfaces produce the same generation plan,
  // so the applications form desugars byte-identically to the stack form.
  it('produces an identical plan from stack and applications forms', async () => {
    const starters = await loadStarterManifests(FOUNDATION_ROOT);
    const options = { modularStarters: modularStarterIds(starters), starters };
    assert.deepEqual(buildGenerationPlan(APPS, options), buildGenerationPlan(STACK, options));
  });

  it('requires exactly one of stack or applications', () => {
    const both = blueprint({ stack: { api: 'nestjs' }, applications: [{ id: 'api', kind: 'api', runtime: 'nestjs' }] });
    assert.ok(validateBlueprint(both).some((m) => m.includes('exactly one of stack or applications')));
    assert.ok(validateBlueprint(blueprint({})).some((m) => m.includes('exactly one of stack or applications')));
  });

  it('enforces the API invariant on the applications surface', () => {
    const webOnly = blueprint({ applications: [{ id: 'web', kind: 'web', runtime: 'nextjs' }] });
    assert.ok(validateBlueprint(webOnly).some((m) => m.includes('An API is mandatory')));
  });

  it('declares but refuses planned kinds and multi-surface (status-gated)', () => {
    const withWorker = blueprint({ applications: [
      { id: 'api', kind: 'api', runtime: 'nestjs' },
      { id: 'notifier', kind: 'worker', runtime: 'nestjs' },
    ] });
    assert.ok(validateBlueprint(withWorker).some((m) => m.includes('worker) is planned and not generatable')));

    const multiWeb = blueprint({ applications: [
      { id: 'api', kind: 'api', runtime: 'nestjs' },
      { id: 'shop-web', kind: 'web', runtime: 'nextjs' },
      { id: 'admin-web', kind: 'web', runtime: 'angular' },
    ] });
    assert.ok(validateBlueprint(multiWeb).some((m) => m.includes('multiple web applications is planned')));
  });

  it('rejects an invalid runtime for a kind and unknown fields', () => {
    const badRuntime = blueprint({ applications: [{ id: 'api', kind: 'api', runtime: 'nextjs' }] });
    assert.ok(validateBlueprint(badRuntime).some((m) => m.includes('runtime nextjs is invalid for kind api')));
  });

  it('validates the optional architecture block', () => {
    assert.deepEqual(validateBlueprint(blueprint({ stack: { api: 'nestjs' }, architecture: { style: 'modular-monolith', evolutionTarget: 'microservices' } })), []);
    assert.ok(validateBlueprint(blueprint({ stack: { api: 'nestjs' }, architecture: { style: 'unknown' } })).some((m) => m.includes('architecture.style is invalid')));
  });
});
