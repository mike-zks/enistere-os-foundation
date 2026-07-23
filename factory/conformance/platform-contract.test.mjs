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
  buildApiConformance,
  STATUS,
  API_CONTRACT_INVARIANTS,
} from './platform-contract.mjs';
import { writeApiConformance } from './run.mjs';

describe('platform-contract — error shape classification', () => {
  it('recognizes the NestJS flat envelope', () => {
    assert.equal(classifyErrorShape('response.status(status).json({ success, statusCode, errorCode, requestId })'), 'flat-envelope');
  });
  it('recognizes the Spring ApiError record', () => {
    assert.equal(classifyErrorShape('public record ApiError(int status, String code, String message, List<String> errors, Instant timestamp, String path) {}'), 'spring-apierror');
  });
  it('recognizes canonical Problem Details', () => {
    assert.equal(classifyErrorShape('{ "type": "...", "title": "...", "detail": "...", "correlationId": "..." }'), 'problem-details');
  });
  it('returns unknown for an unrelated source', () => {
    assert.equal(classifyErrorShape('export const x = 1;'), 'unknown');
  });
});

async function generate(composition, stack, capabilities = ['base']) {
  const root = await mkdtemp(join(tmpdir(), `enistere-conformance-${composition}-`));
  const out = join(root, 'project');
  const blueprint = createDefaultBlueprint(`conformance-${composition}`);
  blueprint.stack = stack;
  blueprint.capabilities = capabilities;
  blueprint.deployment = { environments: ['local'] };
  const plan = await generateProject(blueprint, out);
  return { root, out, plan };
}

describe('platform-contract — computed API conformance', () => {
  const roots = [];
  after(async () => { for (const r of roots) await rm(r, { recursive: true, force: true }); });

  it('measures a generated NestJS API (error non-conformant, health + correlation compliant)', async () => {
    const { root, out, plan } = await generate('nestjs-base', { api: 'nestjs', web: null, mobile: null });
    roots.push(root);
    const report = buildApiConformance({ plan, projectDir: out });

    assert.equal(report.family, 'api');
    assert.equal(report.generatedFrom.planDigest, plan.planDigest);
    const api = report.apps.find((a) => a.runtime === 'nestjs');
    assert.ok(api, 'a nestjs api app is present');
    assert.deepEqual(Object.keys(api.invariants).sort(), [...API_CONTRACT_INVARIANTS].sort());

    // The canonical error is MEASURED non-conformant (flat envelope ≠ Problem Details).
    assert.equal(api.invariants['error-canonical'].status, STATUS.NON_CONFORMANT);
    assert.match(api.invariants['error-canonical'].evidence, /flat-envelope/);
    // Health liveness/readiness and correlation are compliant on NestJS.
    assert.equal(api.invariants['health-liveness-readiness'].status, STATUS.COMPLIANT);
    assert.equal(api.invariants['correlation-id'].status, STATUS.COMPLIANT);
    assert.equal(api.invariants.openapi.status, STATUS.COMPLIANT);
    assert.ok(api.nonConformant.includes('error-canonical'));
  });

  it('measures a generated Spring API (error non-conformant; all invariants reported)', async () => {
    const { root, out, plan } = await generate('spring-base', { api: 'spring', web: null, mobile: null });
    roots.push(root);
    const api = buildApiConformance({ plan, projectDir: out }).apps.find((a) => a.runtime === 'spring');
    assert.ok(api, 'a spring api app is present');
    assert.deepEqual(Object.keys(api.invariants).sort(), [...API_CONTRACT_INVARIANTS].sort());
    assert.equal(api.invariants['error-canonical'].status, STATUS.NON_CONFORMANT);
    // ADR-047 volet 2 convergence: correlation + health reach parity with NestJS.
    assert.equal(api.invariants['correlation-id'].status, STATUS.COMPLIANT);
    assert.equal(api.invariants['health-liveness-readiness'].status, STATUS.COMPLIANT);
    // OpenAPI (springdoc) is present on the base; migrations live in the full
    // composition, so the base is honestly reported as missing them.
    assert.equal(api.invariants.openapi.status, STATUS.COMPLIANT);
    assert.equal(api.invariants.migrations.status, STATUS.MISSING);
  });

  it('rejects an unsupported runtime', () => {
    assert.throws(() => evaluateApiApp({ appDir: '/nonexistent', runtime: 'deno' }), /unsupported/);
  });

  it('writes a computed enistere.conformance.json into a generated project', async () => {
    const { root, out } = await generate('nestjs-base', { api: 'nestjs', web: null, mobile: null });
    roots.push(root);
    const written = writeApiConformance(out);
    const onDisk = JSON.parse(readFileSync(join(out, 'enistere.conformance.json'), 'utf8'));
    assert.equal(onDisk.family, 'api');
    assert.equal(onDisk.evaluation, 'structural');
    assert.deepEqual(onDisk, written);
    assert.ok(onDisk.apps.some((a) => a.runtime === 'nestjs'));
  });
});
