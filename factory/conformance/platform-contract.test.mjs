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
  buildConformance,
  STATUS,
  API_CONTRACT_INVARIANTS,
  WEB_CONTRACT_INVARIANTS,
  MOBILE_CONTRACT_INVARIANTS,
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
    // ADR-056: audit sink (src/audit) and rate-limit mechanism (common/throttling) are base invariants.
    assert.equal(api.invariants['audit-trail'].status, STATUS.COMPLIANT);
    assert.equal(api.invariants['rate-limiting'].status, STATUS.COMPLIANT);
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
    // ADR-056: the base now owns the DB baseline (V0 audit_logs), the audit sink and the
    // rate-limit mechanism, so spring-base is compliant on migrations, audit-trail and rate-limiting.
    assert.equal(api.invariants.openapi.status, STATUS.COMPLIANT);
    assert.equal(api.invariants.migrations.status, STATUS.COMPLIANT);
    assert.equal(api.invariants['audit-trail'].status, STATUS.COMPLIANT);
    assert.equal(api.invariants['rate-limiting'].status, STATUS.COMPLIANT);
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

  it('measures a generated Next.js web (mature: typed client + error handling compliant)', async () => {
    const { root, out, plan } = await generate('nest-next-base', { api: 'nestjs', web: 'nextjs', mobile: null });
    roots.push(root);
    const report = buildConformance({ plan, projectDir: out });
    assert.ok(report.families.includes('web'));
    const web = report.apps.find((a) => a.runtime === 'nextjs');
    assert.ok(web, 'a nextjs web app is present');
    assert.equal(web.family, 'web');
    assert.deepEqual(Object.keys(web.invariants).sort(), [...WEB_CONTRACT_INVARIANTS].sort());
    assert.equal(web.invariants.routing.status, STATUS.COMPLIANT);
    assert.equal(web.invariants['typed-api-access'].status, STATUS.COMPLIANT);
    assert.equal(web.invariants['error-handling'].status, STATUS.COMPLIANT);
  });

  it('measures a generated Angular web (base converged idiomatically: typed access, error handling, states)', async () => {
    const { root, out, plan } = await generate('nestjs-angular-base', { api: 'nestjs', web: 'angular', mobile: null });
    roots.push(root);
    const web = buildConformance({ plan, projectDir: out }).apps.find((a) => a.runtime === 'angular');
    assert.ok(web, 'an angular web app is present');
    assert.equal(web.family, 'web');
    assert.deepEqual(Object.keys(web.invariants).sort(), [...WEB_CONTRACT_INVARIANTS].sort());
    assert.equal(web.invariants.routing.status, STATUS.COMPLIANT);
    // ADR-051: Angular base converges idiomatically (HttpClient + interceptors + AppApiError).
    assert.equal(web.invariants['typed-api-access'].status, STATUS.COMPLIANT);
    assert.equal(web.invariants['error-handling'].status, STATUS.COMPLIANT);
    assert.equal(web.invariants['ui-states'].status, STATUS.COMPLIANT);
    assert.equal(web.invariants.observability.status, STATUS.COMPLIANT);
  });

  it('rejects an unsupported web runtime', () => {
    assert.throws(() => evaluateWebApp({ appDir: '/nonexistent', runtime: 'svelte' }), /unsupported/);
  });
});

describe('platform-contract — computed Mobile conformance', () => {
  const roots = [];
  after(async () => { for (const r of roots) await rm(r, { recursive: true, force: true }); });

  it('measures a generated React Native mobile (mature: typed access, error handling, observability)', async () => {
    const { root, out, plan } = await generate('nestjs-react-native-base', { api: 'nestjs', web: null, mobile: 'react-native' });
    roots.push(root);
    const report = buildConformance({ plan, projectDir: out });
    assert.ok(report.families.includes('mobile'));
    const mobile = report.apps.find((a) => a.runtime === 'react-native');
    assert.ok(mobile, 'a react-native mobile app is present');
    assert.equal(mobile.family, 'mobile');
    assert.deepEqual(Object.keys(mobile.invariants).sort(), [...MOBILE_CONTRACT_INVARIANTS].sort());
    assert.equal(mobile.invariants.navigation.status, STATUS.COMPLIANT);
    assert.equal(mobile.invariants['typed-api-access'].status, STATUS.COMPLIANT);
    assert.equal(mobile.invariants.observability.status, STATUS.COMPLIANT);
  });

  it('measures a generated Flutter mobile (base converged: dio client, error handling, observability)', async () => {
    const { root, out, plan } = await generate('nestjs-flutter-base', { api: 'nestjs', web: null, mobile: 'flutter' });
    roots.push(root);
    const mobile = buildConformance({ plan, projectDir: out }).apps.find((a) => a.runtime === 'flutter');
    assert.ok(mobile, 'a flutter mobile app is present');
    assert.equal(mobile.family, 'mobile');
    assert.deepEqual(Object.keys(mobile.invariants).sort(), [...MOBILE_CONTRACT_INVARIANTS].sort());
    assert.equal(mobile.invariants.navigation.status, STATUS.COMPLIANT);
    assert.equal(mobile.invariants['ui-states'].status, STATUS.COMPLIANT);
    // ADR-053: Flutter base converges on the Dio client + error/logging interceptors.
    assert.equal(mobile.invariants['typed-api-access'].status, STATUS.COMPLIANT);
    assert.equal(mobile.invariants['error-handling'].status, STATUS.COMPLIANT);
    assert.equal(mobile.invariants.observability.status, STATUS.COMPLIANT);
  });

  it('rejects an unsupported mobile runtime', () => {
    assert.throws(() => evaluateMobileApp({ appDir: '/nonexistent', runtime: 'kotlin-native' }), /unsupported/);
  });
});
