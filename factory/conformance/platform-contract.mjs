/**
 * Executable Platform Contract — API family (ADR-047).
 *
 * Evaluates a generated API application against the minimal common invariants of
 * the [Platform Contract](../../docs/specifications/PLATFORM_CONTRACT.md) and
 * produces a COMPUTED conformance record (never a hand-written Markdown status —
 * see CONFORMANCE_MODEL). The evaluation is structural (it inspects the generated
 * project and adapter source); runtime-level proof (Bootable/Conformant via a
 * live boot) is layered by the runtime runner and is opt-in.
 *
 * The canonical error shape is MEASURED, not converged (ADR-047): the spec
 * mandates RFC 7807 Problem Details, and today neither adapter emits it — this is
 * recorded as `non-conformant`, honestly, rather than hidden.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/** Statuses a single invariant can hold (aligned with the runtime gap matrix). */
export const STATUS = Object.freeze({
  COMPLIANT: 'compliant',
  PARTIAL: 'partial',
  MISSING: 'missing',
  NON_CONFORMANT: 'non-conformant',
  NOT_EVALUATED: 'not-evaluated',
});

/**
 * The minimal common API Platform Contract invariants asserted structurally.
 * `runtimeOnly` invariants require a live boot and are reported `not-evaluated`
 * by the structural pass (the runtime runner fills them in).
 */
export const API_CONTRACT_INVARIANTS = Object.freeze([
  'config-validated',
  'error-canonical',
  'correlation-id',
  'health-liveness-readiness',
  'openapi',
  'migrations',
  'base-security',
]);

/** Recursively finds the first file whose basename equals `name`, or null. */
export function findFile(dir, name) {
  if (!existsSync(dir)) return null;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'target' || entry.name === 'dist') continue;
      const found = findFile(full, name);
      if (found) return found;
    } else if (entry.name === name) {
      return full;
    }
  }
  return null;
}

/**
 * Classifies an error-envelope source against the canonical Problem Details.
 * Returns one of: 'problem-details' | 'flat-envelope' | 'spring-apierror' | 'unknown'.
 */
export function classifyErrorShape(source) {
  const has = (token) => source.includes(token);
  // RFC 7807 Problem Details: a `type` URI + `title` + `detail`.
  if (has('application/problem+json') || (has('type') && has('title') && has('detail') && has('correlationId'))) {
    return 'problem-details';
  }
  // NestJS flat envelope (strategy/08_STANDARDS §30 — defunct doc).
  if (has('statusCode') && has('errorCode') && (has('requestId') || has('correlationId'))) return 'flat-envelope';
  // Spring ApiError record.
  if (has('record ApiError') || (has('ApiError') && has('errors') && has('timestamp') && has('path'))) return 'spring-apierror';
  return 'unknown';
}

/** Reads OpenAPI operationIds from a generated NestJS project, or [] if absent. */
function nestjsOperationIds(appDir) {
  const openapi = join(appDir, 'openapi', 'openapi.json');
  if (!existsSync(openapi)) return [];
  try {
    const doc = JSON.parse(readFileSync(openapi, 'utf8'));
    return Object.values(doc.paths ?? {})
      .flatMap((methods) => Object.values(methods).map((op) => op.operationId))
      .filter(Boolean);
  } catch { return []; }
}

/** Evaluates the invariants of a generated NestJS API application. */
function evaluateNestjs(appDir) {
  const ops = nestjsOperationIds(appDir);
  const errorFile = findFile(join(appDir, 'src'), 'all-exceptions.filter.ts');
  const shape = errorFile ? classifyErrorShape(readFileSync(errorFile, 'utf8')) : 'unknown';
  const requestId = findFile(join(appDir, 'src'), 'request-id.middleware.ts');
  const health = ops.includes('health_live') && ops.includes('health_ready')
    ? STATUS.COMPLIANT
    : ops.includes('health_get') ? STATUS.PARTIAL : STATUS.MISSING;
  return {
    'config-validated': result(findFile(join(appDir, 'src'), 'env.validation.ts') ? STATUS.COMPLIANT : STATUS.MISSING, 'env.validation.ts'),
    'error-canonical': errorResult(shape),
    'correlation-id': result(requestId ? STATUS.COMPLIANT : STATUS.MISSING, requestId ? 'request-id.middleware.ts' : 'no correlation middleware'),
    'health-liveness-readiness': result(health, `openapi ops: ${ops.filter((o) => o.startsWith('health')).join(', ') || 'none'}`),
    openapi: result(ops.length ? STATUS.COMPLIANT : STATUS.MISSING, `${ops.length} operations`),
    migrations: result(existsSync(join(appDir, 'prisma', 'migrations')) ? STATUS.COMPLIANT : STATUS.MISSING, 'prisma/migrations'),
    'base-security': result(findFile(join(appDir, 'src'), 'throttling') || readContains(appDir, 'main.ts', 'helmet') ? STATUS.COMPLIANT : STATUS.PARTIAL, 'helmet/throttling'),
  };
}

/** Evaluates the invariants of a generated Spring API application. */
function evaluateSpring(appDir) {
  const java = join(appDir, 'src', 'main', 'java');
  const errorFile = findFile(java, 'ApiError.java');
  const shape = errorFile ? classifyErrorShape(readFileSync(errorFile, 'utf8')) : 'unknown';
  const healthController = findFile(java, 'HealthController.java');
  const correlationFilter = findFile(java, 'CorrelationIdFilter.java');
  const appYml = findFile(join(appDir, 'src', 'main', 'resources'), 'application.yml');
  return {
    'config-validated': result(appYml ? STATUS.PARTIAL : STATUS.MISSING, 'application.yml (no typed base config)'),
    'error-canonical': errorResult(shape),
    'correlation-id': result(correlationFilter ? STATUS.COMPLIANT : STATUS.MISSING, correlationFilter ? 'CorrelationIdFilter.java' : 'no correlation filter'),
    'health-liveness-readiness': result(healthController ? STATUS.COMPLIANT : STATUS.MISSING, healthController ? 'HealthController.java (/health, /health/live, /health/ready)' : 'actuator aggregate only'),
    openapi: result(findFile(java, 'OpenApiConfig.java') ? STATUS.COMPLIANT : STATUS.MISSING, 'springdoc OpenApiConfig'),
    migrations: result(existsSync(join(appDir, 'src', 'main', 'resources', 'db', 'migration')) ? STATUS.COMPLIANT : STATUS.MISSING, 'flyway db/migration'),
    'base-security': result(findFile(java, 'SecurityConfig.java') ? STATUS.COMPLIANT : STATUS.PARTIAL, 'SecurityConfig.java'),
  };
}

function result(status, evidence) { return { status, evidence, source: 'structural' }; }

/**
 * The error invariant is measured against the canonical Problem Details: anything
 * that is not Problem Details is `non-conformant` (ADR-047 defers convergence).
 */
function errorResult(shape) {
  const status = shape === 'problem-details' ? STATUS.COMPLIANT : STATUS.NON_CONFORMANT;
  return { status, evidence: `error shape: ${shape} (canonical target: problem-details)`, source: 'structural' };
}

function readContains(appDir, name, token) {
  const file = findFile(join(appDir, 'src'), name);
  return file ? readFileSync(file, 'utf8').includes(token) : false;
}

/** Evaluates one generated API application by runtime. */
export function evaluateApiApp({ appDir, runtime }) {
  const invariants = runtime === 'nestjs' ? evaluateNestjs(appDir)
    : runtime === 'spring' ? evaluateSpring(appDir)
      : null;
  if (!invariants) throw new Error(`Platform Contract API evaluation unsupported for runtime: ${runtime}`);
  return invariants;
}

/**
 * The structural conformance level: a generated, evaluated app has reached
 * `Generatable`; `Bootable`/`Conformant` require the opt-in runtime runner.
 */
function structuralLevel() { return 'Generatable'; }

/**
 * Builds the computed conformance record for a generated project (API family).
 * Consumes the GenerationPlan only for identity/digests; evidence is read from
 * the generated tree — never from a hand-written status.
 */
export function buildApiConformance({ plan, projectDir }) {
  const apps = plan.applications.filter((app) => app.kind === 'api').map((app) => {
    const invariants = evaluateApiApp({ appDir: join(projectDir, app.appDir), runtime: app.runtime });
    return {
      id: app.id,
      runtime: app.runtime,
      level: structuralLevel(),
      invariants,
      nonConformant: Object.entries(invariants).filter(([, r]) => r.status === STATUS.NON_CONFORMANT || r.status === STATUS.MISSING).map(([id]) => id),
    };
  });
  return {
    schemaVersion: '1',
    family: 'api',
    contract: 'PLATFORM_CONTRACT.md',
    generatedFrom: { systemDigest: plan.systemDigest, resolutionDigest: plan.resolutionDigest, planDigest: plan.planDigest },
    evaluation: 'structural',
    apps,
  };
}
