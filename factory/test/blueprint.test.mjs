import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDefaultBlueprint, validateBlueprint } from '../engine/blueprint.mjs';
import { buildGenerationPlan } from '../engine/plan.mjs';
import { generateProject } from '../engine/generator.mjs';

describe('blueprint v1', () => {
  it('accepts the default Spring + Angular profile', () => assert.deepEqual(validateBlueprint(createDefaultBlueprint()), []));
  it('requires the base capability', () => {
    const value = createDefaultBlueprint(); value.capabilities = ['auth'];
    assert.match(validateBlueprint(value).join(' '), /include base/);
  });
  it('enforces capability dependencies', () => {
    const value = createDefaultBlueprint(); value.capabilities = ['base', 'rbac'];
    assert.match(validateBlueprint(value).join(' '), /rbac requires auth/);
  });
  it('supports all 18 API/web/mobile compositions', () => {
    for (const api of ['nestjs', 'spring']) for (const web of [null, 'nextjs', 'angular']) for (const mobile of [null, 'react-native', 'flutter']) {
      const value = createDefaultBlueprint(); value.stack = { api, web, mobile };
      assert.deepEqual(validateBlueprint(value), [], `${api}/${web}/${mobile}`);
    }
  });
  it('builds an explicit source plan', () => {
    const plan = buildGenerationPlan(createDefaultBlueprint());
    assert.deepEqual(plan.starterSources, { api: 'starters/spring', web: 'starters/angular' });
    assert.equal(plan.generationMode, 'baseline-copy');
    assert.equal(plan.bundledFeaturesMayExceedSelection, true);
  });
  it('generates a deterministic project manifest and lock', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enistere-factory-'));
    const output = join(root, 'project');
    await generateProject(createDefaultBlueprint('sample-app'), output, { materialize: false });
    const lock = JSON.parse(await readFile(join(output, 'enistere.lock'), 'utf8'));
    assert.equal(lock.schemaVersion, '1');
    assert.equal(lock.plan.project, 'sample-app');
  });
  it('generates neutral CRUD contracts from domain entities', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enistere-factory-'));
    const output = join(root, 'project');
    const blueprint = createDefaultBlueprint('catalog-app');
    blueprint.domain.entities = [{ name: 'Product', fields: [{ name: 'id', type: 'uuid', required: true }, { name: 'title', type: 'string', required: true, maxLength: 120 }] }];
    await generateProject(blueprint, output, { materialize: false });
    const contract = JSON.parse(await readFile(join(output, 'packages/contracts/openapi.json'), 'utf8'));
    assert.equal(contract.openapi, '3.1.0');
    assert.ok(contract.paths['/product']);
    assert.equal(contract.components.schemas.Product.properties.id.format, 'uuid');
  });
  it('materializes a selected starter and shared public packages', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enistere-factory-'));
    const output = join(root, 'project');
    const blueprint = createDefaultBlueprint('materialized-app');
    blueprint.stack = { api: 'nestjs', web: null, mobile: null };
    await generateProject(blueprint, output);
    await access(join(output, 'apps/api/package.json'));
    await access(join(output, 'packages/api-contracts/package.json'));
    await access(join(output, 'packages/api-client-fetch/package.json'));
    await access(join(output, 'packages/ui-kit/package.json'));
    await access(join(output, 'capabilities/base/capability.json'));
    const rootPackage = JSON.parse(await readFile(join(output, 'package.json'), 'utf8'));
    assert.deepEqual(rootPackage.workspaces, ['packages/*']);
    assert.match(rootPackage.scripts['build:packages'], /api-contracts/);
  });
  it('rejects generation when a selected capability is only planned', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enistere-factory-'));
    const blueprint = createDefaultBlueprint('blocked-app');
    blueprint.stack = { api: 'nestjs', web: 'nextjs', mobile: 'react-native' };
    blueprint.capabilities = ['base', 'auth'];
    await assert.rejects(
      generateProject(blueprint, join(root, 'project'), { materialize: false }),
      /auth on nestjs is planned/,
    );
  });
  it('plans every supported stack combination as a golden matrix', () => {
    const seen = new Set();
    for (const api of ['nestjs', 'spring']) for (const web of [null, 'nextjs', 'angular']) for (const mobile of [null, 'react-native', 'flutter']) {
      const blueprint = createDefaultBlueprint(`${api}-${web ?? 'no-web'}-${mobile ?? 'no-mobile'}`);
      blueprint.stack = { api, web, mobile };
      const plan = buildGenerationPlan(blueprint);
      seen.add(JSON.stringify(plan.starterSources));
      assert.equal(plan.starterSources.api, `starters/${api}`);
    }
    assert.equal(seen.size, 18);
  });
  it('generates base-only locks for all 18 stack combinations', async () => {
    for (const api of ['nestjs', 'spring']) for (const web of [null, 'nextjs', 'angular']) for (const mobile of [null, 'react-native', 'flutter']) {
      const root = await mkdtemp(join(tmpdir(), 'enistere-golden-'));
      const blueprint = createDefaultBlueprint(`${api}-${web ?? 'none'}-${mobile ?? 'none'}`);
      blueprint.stack = { api, web, mobile };
      const output = join(root, 'project');
      await generateProject(blueprint, output, { materialize: false });
      const lock = JSON.parse(await readFile(join(output, 'enistere.lock'), 'utf8'));
      assert.equal(lock.plan.generationMode, 'baseline-copy');
      assert.equal(lock.plan.bundledFeaturesMayExceedSelection, true);
    }
  });
});
