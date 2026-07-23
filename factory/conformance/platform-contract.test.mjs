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
  buildConformance,
  STATUS,
  API_CONTRACT_INVARIANTS,
  WEB_CONTRACT_INVARIANTS,
} from './platform-contract.mjs';
import { writeConformance } from './run.mjs';

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

  it('measures a generated NestJS API (error canonical, health + correlation compliant)', async () => {
    const { root, out, plan } = await generate('nestjs-base', { api: 'nestjs', web: null, mobile: null });
    roots.push(root);
    const report = buildConformance({ plan, projectDir: out });

    assert.ok(report.families.includes('api'));
    assert.equal(report.generatedFrom.planDigest, plan.planDigest);
    const api = report.apps.find((a) => a.runtime === 'nestjs');
    assert.ok(api, 'a nestjs api app is present');
    assert.equal(api.family, 'api');
    assert.deepEqual(Object.keys(api.invariants).sort(), [...API_CONTRACT_INVARIANTS].sort());

    // ADR-048: the flat envelope is the canonical error contract → compliant.
    assert.equal(api.invariants['error-canonical'].status, STATUS.COMPLIANT);
    assert.match(api.invariants['error-canonical'].evidence, /flat-envelope/);
    assert.equal(api.invariants['health-liveness-readiness'].status, STATUS.COMPLIANT);
    assert.equal(api.invariants['correlation-id'].status, STATUS.COMPLIANT);
    assert.equal(api.invariants.openapi.status, STATUS.COMPLIANT);
    assert.equal(api.invariants.observability.status, STATUS.COMPLIANT);
    assert.ok(!api.nonConformant.includes('error-canonical'));
  });

  it('measures a generated Spring API (error canonical + correlation + health compliant)', async () => {
    const { root, out, plan } = await generate('spring-base', { api: 'spring', web: null, mobile: null });
    roots.push(root);
    const api = buildConformance({ plan, projectDir: out }).apps.find((a) => a.runtime === 'spring');
    assert.ok(api, 'a spring api app is present');
    assert.deepEqual(Object.keys(api.invariants).sort(), [...API_CONTRACT_INVARIANTS].sort());
    // ADR-048 + ADR-047: Spring converges onto the flat envelope, correlation and health.
    assert.equal(api.invariants['error-canonical'].status, STATUS.COMPLIANT);
    assert.equal(api.invariants['correlation-id'].status, STATUS.COMPLIANT);
    assert.equal(api.invariants['health-liveness-readiness'].status, STATUS.COMPLIANT);
    assert.equal(api.invariants.observability.status, STATUS.COMPLIANT);
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
    const written = writeConformance(out);
    const onDisk = JSON.parse(readFileSync(join(out, 'enistere.conformance.json'), 'utf8'));
    assert.ok(onDisk.families.includes('api'));
    assert.equal(onDisk.evaluation, 'structural');
    assert.deepEqual(onDisk, written);
    assert.ok(onDisk.apps.some((a) => a.runtime === 'nestjs'));
  });
});

describe('platform-contract — computed Web conformance', () => {
  const roots = [];
  after(async () => { for (const r of roots) await rm(r, { recursive: true, force: true }); });

  it('measures a generated Next.js web (mature: generated client + error boundary compliant)', async () => {
    const { root, out, plan } = await generate('nest-next-base', { api: 'nestjs', web: 'nextjs', mobile: null });
    roots.push(root);
    const report = buildConformance({ plan, projectDir: out });
    assert.ok(report.families.includes('web'));
    const web = report.apps.find((a) => a.runtime === 'nextjs');
    assert.ok(web, 'a nextjs web app is present');
    assert.equal(web.family, 'web');
    assert.deepEqual(Object.keys(web.invariants).sort(), [...WEB_CONTRACT_INVARIANTS].sort());
    assert.equal(web.invariants.routing.status, STATUS.COMPLIANT);
    assert.equal(web.invariants['generated-api-client'].status, STATUS.COMPLIANT);
    assert.equal(web.invariants['error-boundary'].status, STATUS.COMPLIANT);
  });

  it('measures a generated Angular web (base-only: no generated client at base)', async () => {
    const { root, out, plan } = await generate('nestjs-angular-base', { api: 'nestjs', web: 'angular', mobile: null });
    roots.push(root);
    const web = buildConformance({ plan, projectDir: out }).apps.find((a) => a.runtime === 'angular');
    assert.ok(web, 'an angular web app is present');
    assert.equal(web.family, 'web');
    assert.deepEqual(Object.keys(web.invariants).sort(), [...WEB_CONTRACT_INVARIANTS].sort());
    assert.equal(web.invariants.routing.status, STATUS.COMPLIANT);
    // Angular base does not consume the generated client → honestly missing.
    assert.equal(web.invariants['generated-api-client'].status, STATUS.MISSING);
  });

  it('rejects an unsupported web runtime', () => {
    assert.throws(() => evaluateWebApp({ appDir: '/nonexistent', runtime: 'svelte' }), /unsupported/);
  });
});
