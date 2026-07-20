import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getTargetAdapter } from '../engine/target-adapters.mjs';
import { buildDomainContribution, domainStatusFor } from '../engine/domain.mjs';

const ENTITIES = [{ name: 'Project', fields: [{ name: 'id', type: 'uuid', required: true }] }];

describe('domain seam (R9 plug-in shape)', () => {
  it('is not-applicable without entities', () => {
    assert.equal(domainStatusFor({ id: 'nestjs', renderDomain: () => ({}) }, []), 'not-applicable');
    assert.equal(buildDomainContribution([], { id: 'nestjs', renderDomain: () => ({}) }), null);
  });

  it('is planned on a target that has no renderDomain yet', () => {
    // No built-in adapter renders the domain in Phase 0 → contract-only everywhere.
    assert.equal(domainStatusFor(getTargetAdapter('nestjs'), ENTITIES), 'planned');
    assert.equal(buildDomainContribution(ENTITIES, getTargetAdapter('nestjs')), null);
  });

  // Critère de non-régression du socle: a target renders its domain by providing
  // a `renderDomain` renderer on its adapter — the seam yields an overlay-shaped
  // contribution with no engine edit.
  it('is ready and yields an overlay-shaped contribution when a renderer exists', () => {
    const adapter = {
      id: 'nestjs',
      renderDomain: (entities) => ({
        version: '1.0.0',
        integrations: entities.map((e) => ({ kind: 'nestjs.module', importPath: `./${e.name}.module`, symbol: `${e.name}Module` })),
      }),
    };
    assert.equal(domainStatusFor(adapter, ENTITIES), 'ready');
    const contribution = buildDomainContribution(ENTITIES, adapter);
    assert.equal(contribution.capability, 'domain');
    assert.equal(contribution.target, 'nestjs');
    assert.equal(contribution.version, '1.0.0');
    assert.deepEqual(contribution.files, []);
    assert.equal(contribution.integrations[0].symbol, 'ProjectModule');
  });

  it('rejects a renderer that violates the contribution contract', () => {
    assert.throws(() => buildDomainContribution(ENTITIES, { id: 'nestjs', renderDomain: () => ({}) }), /version must use SemVer/);
    assert.throws(() => buildDomainContribution(ENTITIES, { id: 'nestjs', renderDomain: () => null }), /must return a contribution object/);
  });
});
