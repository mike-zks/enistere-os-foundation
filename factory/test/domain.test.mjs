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

  it('is planned on a target that has no renderDomain yet (contract-only)', () => {
    // Angular has no domain renderer yet → the domain is planned there.
    assert.equal(domainStatusFor(getTargetAdapter('angular'), ENTITIES), 'planned');
    assert.equal(buildDomainContribution(ENTITIES, getTargetAdapter('angular')), null);
  });

  it('is ready on nestjs and renders a real contribution', () => {
    assert.equal(domainStatusFor(getTargetAdapter('nestjs'), ENTITIES), 'ready');
    const contribution = buildDomainContribution(ENTITIES, getTargetAdapter('nestjs'));
    assert.equal(contribution.capability, 'domain');
    assert.equal(contribution.prisma.models[0].name, 'Project');
    assert.ok(contribution.files.some((f) => f.destination === 'src/domain/project/project.service.ts'));
    assert.ok(contribution.integrations.some((i) => i.kind === 'nestjs.module' && i.symbol === 'ProjectModule'));
    assert.match(contribution.digest, /^[0-9a-f]{64}$/);
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

  it('compiles the domain into a generated NestJS project', async () => {
    const { mkdtemp, rm, readFile, access } = await import('node:fs/promises');
    const { constants } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const { generateProject } = await import('../engine/generator.mjs');
    const { createDefaultBlueprint } = await import('../engine/blueprint.mjs');

    const root = await mkdtemp(join(tmpdir(), 'enistere-domain-'));
    try {
      const bp = createDefaultBlueprint('domain-app');
      bp.stack = { api: 'nestjs', web: null, mobile: null };
      bp.capabilities = ['base'];
      bp.deployment = { environments: ['local'] };
      bp.domain.entities = [
        { name: 'Product', fields: [
          { name: 'id', type: 'uuid', required: true },
          { name: 'title', type: 'string', required: true, maxLength: 120 },
          { name: 'price', type: 'number', required: true },
        ] },
        { name: 'Category', fields: [
          { name: 'id', type: 'uuid', required: true },
          { name: 'label', type: 'string', required: true },
        ] },
      ];
      const out = join(root, 'p');
      await generateProject(bp, out);

      await access(join(out, 'apps/api/src/domain/product/product.service.ts'), constants.F_OK);
      await access(join(out, 'apps/api/src/domain/category/category.module.ts'), constants.F_OK);
      const schema = await readFile(join(out, 'apps/api/prisma/schema.prisma'), 'utf8');
      assert.match(schema, /model Product \{/);
      assert.match(schema, /@@map\("products"\)/);
      assert.match(schema, /model Category \{/);
      const comp = await readFile(join(out, 'apps/api/src/composition/capabilities.ts'), 'utf8');
      assert.match(comp, /ProductModule/);
      assert.match(comp, /CategoryModule/);
      const service = await readFile(join(out, 'apps/api/src/domain/product/product.service.ts'), 'utf8');
      assert.match(service, /this\.prisma\.product\.findMany\(\)/);
      const lock = JSON.parse(await readFile(join(out, 'enistere.lock'), 'utf8'));
      assert.ok(lock.overlays.some((o) => o.capability === 'domain' && o.target === 'nestjs'));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
