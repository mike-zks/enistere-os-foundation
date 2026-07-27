import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { after, before, describe, it } from 'node:test';

import { createDefaultBlueprint } from '../engine/blueprint.mjs';
import { generateProject } from '../engine/generator.mjs';
import {
  evaluateAuthenticationProduct,
  validateProductContract,
  verifyMaterializedAuthentication,
} from './capability-product.mjs';

const REPO_ROOT = resolve(import.meta.dirname, '../..');

describe('Authentication product conformance', () => {
  let root;
  before(async () => {
    root = await mkdtemp(join(tmpdir(), 'enistere-auth-conformance-'));
  });
  after(async () => {
    if (root) await rm(root, { recursive: true, force: true });
  });

  it('closes the neutral contract for every ready target', async () => {
    const report = await evaluateAuthenticationProduct({ repoRoot: REPO_ROOT });
    assert.equal(report.status, 'CONFORMANT');
    assert.deepEqual(report.readyTargets, ['nestjs', 'nextjs', 'react-native', 'spring']);
    for (const target of report.readyTargets) {
      assert.equal(report.targets[target].status, 'CONFORMANT');
      assert.ok(report.targets[target].invariants.length > 0);
      assert.ok(report.targets[target].proofCount > 0);
    }
    assert.equal(report.targets.fastapi.status, 'UNSUPPORTED');
    assert.equal(report.targets.angular.status, 'PLANNED');
    assert.equal(report.targets.flutter.status, 'PLANNED');
  });

  it('rejects unknown roles and duplicate invariant ids', () => {
    const issues = validateProductContract({
      schemaVersion: '1',
      id: 'authentication-product',
      version: '1.0.0',
      capability: 'auth',
      roles: ['authority'],
      invariants: [
        { id: 'AUTH-AUTHORITY-001', appliesTo: ['ghost'], requirement: 'one' },
        { id: 'AUTH-AUTHORITY-001', appliesTo: ['authority'], requirement: 'two' },
      ],
    });
    assert.ok(issues.some((issue) => issue.includes('unknown role')));
    assert.ok(issues.some((issue) => issue.includes('duplicate invariant')));
  });

  it('proves the same evidence exists in a materialized multi-client system', async () => {
    const blueprint = createDefaultBlueprint('auth-conformance-materialized');
    blueprint.stack = { api: 'nestjs', web: 'nextjs', mobile: 'react-native' };
    blueprint.capabilities = ['auth'];
    blueprint.designSystem = true;
    blueprint.deployment = { environments: ['local'] };
    const projectDir = join(root, 'project');
    const plan = await generateProject(blueprint, projectDir);
    const report = await verifyMaterializedAuthentication(projectDir, plan, REPO_ROOT);
    for (const target of ['nestjs', 'nextjs', 'react-native']) {
      assert.equal(report.targets[target].status, 'CONFORMANT');
      assert.equal(report.targets[target].materialized, true);
    }
    const written = JSON.parse(await readFile(
      join(projectDir, 'enistere.capability-conformance.json'),
      'utf8',
    ));
    assert.equal(written.status, 'CONFORMANT');
  });

  it('fails when a materialized proof marker disappears', async () => {
    const blueprint = createDefaultBlueprint('auth-conformance-tampered');
    blueprint.stack = { api: 'nestjs', web: null, mobile: null };
    blueprint.capabilities = ['auth'];
    blueprint.deployment = { environments: ['local'] };
    const projectDir = join(root, 'tampered');
    const plan = await generateProject(blueprint, projectDir);
    const testPath = join(projectDir, 'apps/api/test/auth-login.e2e-spec.ts');
    const content = await readFile(testPath, 'utf8');
    await writeFile(testPath, content.replace('logs in a valid user', 'removed proof marker'));
    await assert.rejects(
      () => verifyMaterializedAuthentication(projectDir, plan, REPO_ROOT),
      /Authentication product conformance failed/,
    );
  });
});
