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
    assert.equal(byCapability.files, 'capabilities/files/contracts/files.product.v1.json');
  });

  it('closes the neutral contract for every ready target, and states where it does not', async () => {
    const reports = await evaluateAllCapabilityProducts({ repoRoot: REPO_ROOT });
    const byCapability = Object.fromEntries(reports.map((item) => [item.capability, item]));
    assert.ok(reports.length >= 3);

    for (const capability of ['auth', 'rbac']) {
      assert.equal(byCapability[capability].status, 'CONFORMANT');
      for (const target of byCapability[capability].readyTargets) {
        assert.equal(byCapability[capability].targets[target].status, 'CONFORMANT');
        assert.ok(byCapability[capability].targets[target].proofCount > 0);
      }
    }

    // files is honestly NOT conformant: Spring holds two of the seven
    // responsibilities NestJS holds, and both are API runtimes. Every proof it
    // does declare passes — the only issue is the parity gap itself.
    assert.equal(byCapability.files.status, 'NON_CONFORMANT');
    const spring = byCapability.files.targets.spring;
    assert.equal(spring.familyParity.status, 'BREACH');
    assert.equal(spring.family, 'api');
    assert.deepEqual(
      spring.familyParity.missing,
      ['quota', 'reconciliation'],
    );
    assert.deepEqual(
      spring.issues.filter((issue) => !issue.startsWith('family parity:')),
      [],
    );
    assert.equal(byCapability.files.targets.nestjs.status, 'CONFORMANT');
  });

  it('does not constrain a target that is alone in its family', async () => {
    const report = await evaluateCapabilityProduct({ capability: 'files', repoRoot: REPO_ROOT });
    // Angular and Flutter are not ready, so nextjs and react-native have nobody
    // to match: partial coverage there is a scope decision, not a breach.
    assert.equal(report.targets.nextjs.familyParity.status, 'OK');
    assert.equal(report.targets.nextjs.coverage, '5/7');
    assert.equal(report.targets['react-native'].familyParity.status, 'OK');
    assert.equal(report.targets['react-native'].coverage, '1/7');
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

  it('scopes invariants to the responsibilities a target actually holds', async () => {
    const report = await evaluateCapabilityProduct({ capability: 'files', repoRoot: REPO_ROOT });

    // Same role, very different surfaces: the contract must not ask Spring to
    // prove quarantine or quota it never claimed, nor let it pass as full support.
    assert.equal(report.targets.nestjs.coverage, '7/7');
    assert.equal(report.targets.spring.coverage, '5/7');
    assert.ok(report.targets.nestjs.invariants.length > report.targets.spring.invariants.length);
    assert.ok(report.targets.spring.invariants.includes('FILES-AUTHORITY-003'));
    // Ported so far: metadata, delete and quarantine are measured on Spring too.
    assert.ok(report.targets.spring.invariants.includes('FILES-AUTHORITY-006'));
    assert.ok(report.targets.spring.invariants.includes('FILES-AUTHORITY-007'));
    assert.ok(report.targets.spring.invariants.includes('FILES-AUTHORITY-008'));
    // Still absent, so still not demanded of it.
    assert.ok(!report.targets.spring.invariants.includes('FILES-AUTHORITY-009'));
    assert.ok(!report.targets.spring.invariants.includes('FILES-AUTHORITY-010'));
    // Cross-cutting invariants carry no responsibility, so every target proves them.
    for (const target of ['nestjs', 'spring']) {
      assert.ok(report.targets[target].invariants.includes('FILES-AUTHORITY-001'));
      assert.ok(report.targets[target].invariants.includes('FILES-AUTHORITY-002'));
    }
    // A one-responsibility mobile client is conformant on exactly that one.
    assert.equal(report.targets['react-native'].coverage, '1/7');
    assert.deepEqual(
      report.targets['react-native'].invariants,
      ['FILES-CLIENT-001', 'FILES-CLIENT-002'],
    );
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
    blueprint.capabilities = ['auth', 'rbac', 'files'];
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
    // Files materializes on all three, each measured on what it actually holds.
    for (const target of ['nestjs', 'nextjs', 'react-native']) {
      assert.equal(byCapability.files.targets[target].status, 'CONFORMANT');
      assert.equal(byCapability.files.targets[target].materialized, true);
    }
    assert.equal(byCapability.files.targets['react-native'].coverage, '1/7');
    assert.equal(byCapability.files.targets.nestjs.coverage, '7/7');

    const written = JSON.parse(await readFile(
      join(projectDir, 'enistere.capability-conformance.json'),
      'utf8',
    ));
    assert.equal(written.capabilities.length, 3);
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
