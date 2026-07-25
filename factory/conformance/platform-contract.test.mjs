import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { generateProject } from '../engine/generator.mjs';
import { createDefaultBlueprint } from '../engine/blueprint.mjs';
import {
  classifyErrorShape,
  evaluateApiApp,
  evaluateWebApp,
  evaluateMobileApp,
  evaluateCommonBaseline,
  buildConformance,
  validatePlatformBaselineContract,
  PLATFORM_BASELINE_CONTRACT,
  COMMON_BASELINE_INVARIANTS,
  API_CONTRACT_INVARIANTS,
  WEB_CONTRACT_INVARIANTS,
  MOBILE_CONTRACT_INVARIANTS,
  STATUS,
} from './platform-contract.mjs';
import { writeConformance } from './run.mjs';

async function generate(composition, stack, capabilities = []) {
  const root = await mkdtemp(join(tmpdir(), `enistere-conformance-${composition}-`));
  const out = join(root, 'project');
  const blueprint = createDefaultBlueprint(`conformance-${composition}`);
  blueprint.stack = stack;
  blueprint.capabilities = capabilities;
  blueprint.deployment = { environments: ['local'] };
  const plan = await generateProject(blueprint, out);
  return { root, out, plan };
}

function assertContractKeys(app, expectedFamily) {
  assert.equal(app.baseline.contractVersion, 'common/2.0.0');
  assert.equal(app.familyContract.contractVersion, `${app.family}/2.0.0`);
  assert.deepEqual(Object.keys(app.baseline.invariants).sort(), [...COMMON_BASELINE_INVARIANTS].sort());
  assert.deepEqual(Object.keys(app.familyContract.invariants).sort(), [...expectedFamily].sort());
}

describe('Platform Baseline v2 — contract registry and error shape', () => {
  it('loads one versioned contract for Common/API/Web/Mobile', () => {
    assert.equal(PLATFORM_BASELINE_CONTRACT.version, '2.0.0');
    assert.equal(PLATFORM_BASELINE_CONTRACT.common.contractVersion, 'common/2.0.0');
    assert.deepEqual(Object.keys(PLATFORM_BASELINE_CONTRACT.families), ['api', 'web', 'mobile']);
    assert.deepEqual(validatePlatformBaselineContract(PLATFORM_BASELINE_CONTRACT), []);
    assert.match(validatePlatformBaselineContract({})[0], /schemaVersion/);
  });

  it('classifies the canonical and rejected API error shapes', () => {
    assert.equal(classifyErrorShape('response.json({ statusCode, errorCode, requestId })'), 'flat-envelope');
    assert.equal(classifyErrorShape('record ApiError(errors, timestamp, path)'), 'spring-apierror');
    assert.equal(classifyErrorShape('{ type, title, detail, correlationId }'), 'problem-details');
    assert.equal(classifyErrorShape('export const x = 1'), 'unknown');
  });

  it('reports every invariant missing for an empty runtime tree', () => {
    const common = evaluateCommonBaseline({ appDir: '/nonexistent', runtime: 'nestjs' });
    assert.deepEqual(Object.keys(common).sort(), [...COMMON_BASELINE_INVARIANTS].sort());
    assert.ok(Object.values(common).every((entry) => entry.status === STATUS.MISSING));
  });
});

describe('Platform Baseline v2 — six runtime gap reports', () => {
  const roots = [];
  after(async () => { for (const root of roots) await rm(root, { recursive: true, force: true }); });

  it('evaluates NestJS and Spring against Common + API v2', async () => {
    for (const runtime of ['nestjs', 'spring']) {
      const generated = await generate(`${runtime}-base`, { api: runtime, web: null, mobile: null });
      roots.push(generated.root);
      const report = buildConformance({ plan: generated.plan, projectDir: generated.out });
      assert.equal(report.schemaVersion, '2');
      assert.equal(report.contract.version, '2.0.0');
      const app = report.apps.find((item) => item.runtime === runtime);
      assertContractKeys(app, API_CONTRACT_INVARIANTS);
      assert.equal(app.familyContract.invariants['canonical-http-errors'].status, STATUS.COMPLIANT);
      assert.equal(app.familyContract.invariants['rate-limiting'].status, STATUS.COMPLIANT);
      assert.equal(app.baseline.invariants.observability.status, STATUS.COMPLIANT);
      assert.equal(app.baseline.invariants.observability.source, 'behavioral-test');
      assert.equal(app.baseline.invariants['technical-audit'].status, STATUS.COMPLIANT);
      assert.equal(app.baseline.invariants['security-baseline'].status, STATUS.COMPLIANT);
      assert.equal(app.baseline.invariants['lifecycle-hooks'].status, STATUS.COMPLIANT);
      assert.equal(app.baseline.invariants['extension-points'].status, STATUS.COMPLIANT);
      assert.equal(app.familyContract.invariants['authentication-hook'].status, STATUS.COMPLIANT);
      assert.equal(app.familyContract.invariants['authorization-hook'].status, STATUS.COMPLIANT);
      assert.equal(app.familyContract.invariants['file-hook'].status, STATUS.COMPLIANT);
      assert.equal(app.familyContract.invariants['event-hook'].status, STATUS.COMPLIANT);
      assert.equal(app.familyContract.invariants['graceful-shutdown'].source, 'behavioral-test');
      assert.equal(app.baseline.invariants.configuration.status, STATUS.COMPLIANT);
      assert.equal(app.baseline.invariants.diagnostics.status, STATUS.COMPLIANT);
      assert.equal(app.baseline.invariants['build-quality-gates'].status, STATUS.COMPLIANT);
      assert.equal(app.familyContract.invariants['persistence-ports'].status, STATUS.COMPLIANT);
      assert.equal(app.familyContract.invariants['transaction-ports'].status, STATUS.COMPLIANT);
      assert.equal(app.familyContract.invariants['input-validation'].status, STATUS.COMPLIANT);
      assert.deepEqual(app.diagnostics, []);
    }
  });

  it('evaluates Next.js and Angular against Common + Web v2 without claiming full conformance', async () => {
    for (const runtime of ['nextjs', 'angular']) {
      const generated = await generate(`${runtime}-base`, { api: 'nestjs', web: runtime, mobile: null });
      roots.push(generated.root);
      const app = buildConformance({ plan: generated.plan, projectDir: generated.out }).apps.find((item) => item.runtime === runtime);
      assertContractKeys(app, WEB_CONTRACT_INVARIANTS);
      assert.equal(app.familyContract.invariants.routing.status, STATUS.COMPLIANT);
      assert.notEqual(app.baseline.invariants.observability.status, STATUS.COMPLIANT);
      assert.equal(app.baseline.invariants['technical-audit'].status, STATUS.MISSING);
    }
  });

  it('evaluates React Native and Flutter against Common + Mobile v2 without hiding gaps', async () => {
    for (const runtime of ['react-native', 'flutter']) {
      const generated = await generate(`${runtime}-base`, { api: 'nestjs', web: null, mobile: runtime });
      roots.push(generated.root);
      const app = buildConformance({ plan: generated.plan, projectDir: generated.out }).apps.find((item) => item.runtime === runtime);
      assertContractKeys(app, MOBILE_CONTRACT_INVARIANTS);
      assert.equal(app.familyContract.invariants.navigation.status, STATUS.COMPLIANT);
      assert.notEqual(app.baseline.invariants.observability.status, STATUS.COMPLIANT);
      assert.ok(app.nonConformant.some((id) => id.startsWith('baseline.')));
    }
  });

  it('writes the v2 computed report into a generated project', async () => {
    const generated = await generate('write-report', { api: 'nestjs', web: null, mobile: null });
    roots.push(generated.root);
    const written = writeConformance(generated.out);
    const onDisk = JSON.parse(readFileSync(join(generated.out, 'enistere.conformance.json'), 'utf8'));
    assert.deepEqual(onDisk, written);
    assert.equal(onDisk.schemaVersion, '2');
    assert.equal(onDisk.contract.source, 'factory/conformance/contracts/platform-baseline.v2.json');
  });

  it('rejects unsupported family adapters', () => {
    assert.throws(() => evaluateApiApp({ appDir: '/nonexistent', runtime: 'deno' }), /unsupported/);
    assert.throws(() => evaluateWebApp({ appDir: '/nonexistent', runtime: 'svelte' }), /unsupported/);
    assert.throws(() => evaluateMobileApp({ appDir: '/nonexistent', runtime: 'kotlin-native' }), /unsupported/);
  });
});
