import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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

  it('proves every ready target, and counts the runtimes left behind', async () => {
    const reports = await evaluateAllCapabilityProducts({ repoRoot: REPO_ROOT });
    assert.ok(reports.length >= 3);

    for (const report of reports) {
      // Every target that claims readiness must still prove its invariants…
      for (const target of report.readyTargets) {
        const result = report.targets[target];
        assert.equal(result.status, 'CONFORMANT', `${report.capability}/${target}`);
        assert.ok(result.proofCount > 0);
        assert.deepEqual(
          result.issues.filter((issue) => !issue.startsWith('family parity:')),
          [],
        );
      }
      // …and the capability is only conformant when no served runtime is left
      // behind. Today three are, which is why all three read NON_CONFORMANT
      // (ADR-074) — the honest verdict, not a regression.
      assert.equal(report.status, 'NON_CONFORMANT');
    }
  });

  it('exempts a not-applicable target only when it states why', async () => {
    const report = await evaluateCapabilityProduct({ capability: 'rbac', repoRoot: REPO_ROOT });
    const mobile = report.targets['react-native'];
    assert.equal(mobile.manifestStatus, 'not-applicable');
    // The exemption survives the stricter rule precisely because the manifest
    // carries a machine-readable rationale; without one it would be the new
    // escape hatch that `unsupported` used to be.
    assert.equal(mobile.familyParity.status, 'OK');
  });

  it('holds a runtime to what its family peers actually implement', async () => {
    const files = await evaluateCapabilityProduct({ capability: 'files', repoRoot: REPO_ROOT });
    // React Native holds only `upload`, so Flutter owes only `upload` — the bar
    // is peer coverage, not the capability's full scope.
    assert.deepEqual(files.targets.flutter.familyParity.missing, ['upload']);

    const rbac = await evaluateCapabilityProduct({ capability: 'rbac', repoRoot: REPO_ROOT });
    // Nobody in the mobile family implements RBAC, so Flutter owes nothing.
    assert.equal(rbac.targets.flutter.familyParity.status, 'OK');
  });

  it('keeps the API family at equal responsibilities on files', async () => {
    const report = await evaluateCapabilityProduct({ capability: 'files', repoRoot: REPO_ROOT });
    // The gap ADR-070 measured is closed: both API runtimes now hold all seven.
    assert.equal(report.targets.nestjs.coverage, '7/7');
    assert.equal(report.targets.spring.coverage, '7/7');
    assert.deepEqual(report.targets.spring.invariants, report.targets.nestjs.invariants);
  });

  it('still detects a family-parity breach when one appears', async () => {
    // Reality is green, so the rule is exercised against a synthetic repository:
    // otherwise the guarantee that a divergence is caught would stop being tested
    // the moment the divergence was fixed.
    const root = await mkdtemp(join(tmpdir(), 'enistere-parity-fixture-'));
    try {
      const capability = join(root, 'capabilities', 'sample');
      await mkdir(join(capability, 'contracts'), { recursive: true });
      await writeFile(join(capability, 'contracts', 'sample.product.v1.json'), JSON.stringify({
        schemaVersion: '1',
        id: 'sample-product',
        version: '1.0.0',
        capability: 'sample',
        roles: ['authority'],
        invariants: [
          { id: 'SAMPLE-AUTHORITY-001', appliesTo: ['authority'], requirement: 'always' },
          {
            id: 'SAMPLE-AUTHORITY-002',
            responsibility: 'extra',
            appliesTo: ['authority'],
            requirement: 'only with extra',
          },
        ],
      }));
      const target = (responsibilities) => ({
        status: 'ready',
        mode: 'overlay',
        adapter: { id: 'placeholder', version: '1.0.0' },
        responsibilities,
        contracts: [],
        primitives: [],
        deploymentModes: ['embedded'],
        migrations: [],
        conformance: ['sample-suite'],
      });
      const manifest = {
        schemaVersion: '2',
        id: 'sample',
        version: '1.0.0',
        requires: [],
        conflicts: [],
        responsibilities: ['core', 'extra'],
        contracts: [],
        primitives: [],
        configuration: {},
        targets: {
          nestjs: { ...target(['core', 'extra']), adapter: { id: 'nestjs', version: '1.0.0' } },
          spring: { ...target(['core']), adapter: { id: 'spring', version: '1.0.0' } },
          fastapi: { status: 'unsupported' },
          nextjs: { status: 'planned' },
          angular: { status: 'planned' },
          'react-native': { status: 'planned' },
          flutter: { status: 'planned' },
        },
        migrations: [],
        conformance: [{ id: 'sample-suite', target: 'nestjs', level: 'contract', evidence: 'golden-runtime' }],
      };
      await writeFile(join(capability, 'capability.json'), JSON.stringify(manifest));

      const report = await evaluateCapabilityProduct({ capability: 'sample', repoRoot: root });
      const spring = report.targets.spring;
      assert.equal(spring.familyParity.status, 'BREACH');
      assert.equal(spring.family, 'api');
      assert.deepEqual(spring.familyParity.missing, ['extra']);
      assert.equal(report.status, 'NON_CONFORMANT');
      // The breach alone is enough: it does not need a missing proof to fail.
      assert.ok(spring.issues.some((issue) => issue.startsWith('family parity:')));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
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

  it('keeps Authentication measured on its five ready targets', async () => {
    const report = await evaluateCapabilityProduct({ capability: 'auth', repoRoot: REPO_ROOT });
    assert.deepEqual(report.readyTargets, ['angular', 'nestjs', 'nextjs', 'react-native', 'spring']);
    assert.equal(report.targets.fastapi.status, 'UNSUPPORTED');
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
    // A mobile client holding only `upload` is not asked to prove listing,
    // deletion or quota — but still owes the cross-cutting client invariant.
    const mobile = report.targets['react-native'];
    assert.equal(mobile.coverage, '1/7');
    assert.ok(mobile.invariants.includes('FILES-CLIENT-001'));
    assert.ok(mobile.invariants.includes('FILES-CLIENT-002'));
    assert.ok(!mobile.invariants.includes('FILES-CLIENT-003'));
    assert.ok(!mobile.invariants.includes('FILES-CLIENT-005'));
    // The API authorities hold everything, so they owe every scoped invariant.
    assert.equal(report.targets.nestjs.coverage, '7/7');
    for (const id of ['FILES-AUTHORITY-003', 'FILES-AUTHORITY-008', 'FILES-AUTHORITY-010']) {
      assert.ok(report.targets.nestjs.invariants.includes(id));
      assert.ok(report.targets.spring.invariants.includes(id));
    }
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

  it('detects a proof marker that no longer matches its source', async () => {
    // The evaluator checks that markers are PRESENT; nothing checked that the
    // markers still describe something. Renaming a test silently breaks the
    // link, and the failure only surfaces later as a conformance regression
    // with no hint of the cause. This walks every declared proof and reports
    // the orphans directly.
    const contracts = await discoverProductContracts(REPO_ROOT);
    const orphans = [];

    for (const { capability } of contracts) {
      const manifest = JSON.parse(await readFile(
        join(REPO_ROOT, 'capabilities', capability, 'capability.json'), 'utf8',
      ));
      for (const [target, targetManifest] of Object.entries(manifest.targets)) {
        if (targetManifest.status !== 'ready') continue;
        const descriptorPath = join(
          REPO_ROOT, 'capabilities', capability, 'targets', target, 'conformance.json',
        );
        const descriptor = JSON.parse(await readFile(descriptorPath, 'utf8'));

        for (const [invariant, proofs] of Object.entries(descriptor.invariants ?? {})) {
          for (const proof of proofs) {
            const owner = proof.owner ?? capability;
            const source = join(REPO_ROOT, 'capabilities', owner, 'targets', target, proof.source);
            let content;
            try {
              content = await readFile(source, 'utf8');
            } catch {
              orphans.push(`${capability}/${target} ${invariant}: source ${proof.source} is gone`);
              continue;
            }
            for (const marker of proof.contains) {
              if (!content.includes(marker)) {
                orphans.push(`${capability}/${target} ${invariant}: "${marker}" no longer in ${proof.source}`);
              }
            }
          }
        }
      }
    }

    assert.deepEqual(orphans, [], 'every declared proof marker must still exist in its source');
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
