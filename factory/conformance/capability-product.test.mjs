import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { after, before, describe, it } from 'node:test';

import { createDefaultBlueprint } from '../engine/blueprint.mjs';
import { generateProject } from '../engine/generator.mjs';
import {
  discoverProductContracts,
  evaluateAllCapabilityProducts,
  evaluateCapabilityProduct,
  validateProductContract,
  verifyMaterializedCapabilities,
} from './capability-product.mjs';

const REPO_ROOT = resolve(import.meta.dirname, '../..');

describe('capability product conformance', () => {
  let root;
  before(async () => {
    root = await mkdtemp(join(tmpdir(), 'enistere-capability-conformance-'));
  });
  after(async () => {
    if (root) await rm(root, { recursive: true, force: true });
  });

  it('discovers product contracts by convention, without a central list', async () => {
    const found = await discoverProductContracts(REPO_ROOT);
    const byCapability = Object.fromEntries(found.map((item) => [item.capability, item.path]));
    assert.equal(byCapability.auth, 'capabilities/auth/contracts/authentication.product.v1.json');
    assert.equal(byCapability.rbac, 'capabilities/rbac/contracts/authorization.product.v1.json');
  });

  it('closes the neutral contract for every ready target of every capability', async () => {
    const reports = await evaluateAllCapabilityProducts({ repoRoot: REPO_ROOT });
    assert.ok(reports.length >= 2);
    for (const report of reports) {
      assert.equal(report.status, 'CONFORMANT', `${report.capability} is not conformant`);
      for (const target of report.readyTargets) {
        assert.equal(report.targets[target].status, 'CONFORMANT');
        assert.ok(report.targets[target].invariants.length > 0);
        assert.ok(report.targets[target].proofCount > 0);
      }
    }
  });

  it('keeps Authentication measured on its four ready targets', async () => {
    const report = await evaluateCapabilityProduct({ capability: 'auth', repoRoot: REPO_ROOT });
    assert.deepEqual(report.readyTargets, ['nestjs', 'nextjs', 'react-native', 'spring']);
    assert.equal(report.targets.fastapi.status, 'UNSUPPORTED');
    assert.equal(report.targets.angular.status, 'PLANNED');
    assert.equal(report.targets.flutter.status, 'PLANNED');
  });

  it('treats a not-applicable target as a legitimate absence, never as conformance', async () => {
    const report = await evaluateCapabilityProduct({ capability: 'rbac', repoRoot: REPO_ROOT });
    const mobile = report.targets['react-native'];
    assert.equal(mobile.manifestStatus, 'not-applicable');
    assert.equal(mobile.status, 'NOT_APPLICABLE');
    // No role, no invariant, no proof — and excluded from the conformance verdict.
    assert.deepEqual(mobile.roles, []);
    assert.deepEqual(mobile.invariants, []);
    assert.ok(!report.readyTargets.includes('react-native'));
    assert.deepEqual(report.readyTargets, ['nestjs', 'nextjs', 'spring']);
  });

  it('rejects unknown roles, duplicate invariant ids and a foreign capability', () => {
    const issues = validateProductContract({
      schemaVersion: '1',
      id: 'authorization-product',
      version: '1.0.0',
      capability: 'rbac',
      roles: ['authority'],
      invariants: [
        { id: 'RBAC-AUTHORITY-001', appliesTo: ['ghost'], requirement: 'one' },
        { id: 'RBAC-AUTHORITY-001', appliesTo: ['authority'], requirement: 'two' },
      ],
    }, 'files');
    assert.ok(issues.some((issue) => issue.includes('unknown role')));
    assert.ok(issues.some((issue) => issue.includes('duplicate invariant')));
    assert.ok(issues.some((issue) => issue.includes('capability must be files')));
  });

  it('proves the same evidence exists in a materialized multi-client system', async () => {
    const blueprint = createDefaultBlueprint('capability-conformance-materialized');
    blueprint.stack = { api: 'nestjs', web: 'nextjs', mobile: 'react-native' };
    blueprint.capabilities = ['auth', 'rbac'];
    blueprint.designSystem = true;
    blueprint.deployment = { environments: ['local'] };
    const projectDir = join(root, 'project');
    const plan = await generateProject(blueprint, projectDir);
    const reports = await verifyMaterializedCapabilities(projectDir, plan, REPO_ROOT);

    const byCapability = Object.fromEntries(reports.map((item) => [item.capability, item]));
    for (const target of ['nestjs', 'nextjs', 'react-native']) {
      assert.equal(byCapability.auth.targets[target].status, 'CONFORMANT');
      assert.equal(byCapability.auth.targets[target].materialized, true);
    }
    for (const target of ['nestjs', 'nextjs']) {
      assert.equal(byCapability.rbac.targets[target].status, 'CONFORMANT');
      assert.equal(byCapability.rbac.targets[target].materialized, true);
    }
    // RBAC owns no mobile surface: nothing is materialized, nothing is claimed.
    assert.equal(byCapability.rbac.targets['react-native'].materialized, false);

    const written = JSON.parse(await readFile(
      join(projectDir, 'enistere.capability-conformance.json'),
      'utf8',
    ));
    assert.equal(written.capabilities.length, 2);
  });

  it('fails when a materialized proof marker disappears', async () => {
    const blueprint = createDefaultBlueprint('capability-conformance-tampered');
    blueprint.stack = { api: 'nestjs', web: null, mobile: null };
    blueprint.capabilities = ['auth', 'rbac'];
    blueprint.deployment = { environments: ['local'] };
    const projectDir = join(root, 'tampered');
    const plan = await generateProject(blueprint, projectDir);
    const testPath = join(projectDir, 'apps/api/test/auth-rbac.e2e-spec.ts');
    const content = await readFile(testPath, 'utf8');
    await writeFile(testPath, content.replace('records an authorization denial audit event', 'removed'));
    await assert.rejects(
      () => verifyMaterializedCapabilities(projectDir, plan, REPO_ROOT),
      /capability product conformance failed/,
    );
  });
});
