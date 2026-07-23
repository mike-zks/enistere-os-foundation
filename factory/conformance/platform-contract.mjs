/**
 * Executable Platform Contract — API and Web families (ADR-047, ADR-050).
 *
 * Evaluates a generated application (API, Web) against the minimal common invariants of
 * the [Platform Contract](../../docs/specifications/PLATFORM_CONTRACT.md) and
 * produces a COMPUTED conformance record (never a hand-written Markdown status —
 * see CONFORMANCE_MODEL). The evaluation is structural (it inspects the generated
 * project and adapter source); runtime-level proof (Bootable/Conformant via a
 * live boot) is layered by the runtime runner and is opt-in.
 *
 * The canonical error shape is the flat `ApiErrorResponse` envelope (ADR-048),
 * emitted by both adapters and consumed by the generated client; anything else is
 * recorded as `non-conformant`.
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
  'observability',
]);

/** The minimal Web base Platform Contract invariants (ADR-050), asserted structurally. */
export const WEB_CONTRACT_INVARIANTS = Object.freeze([
  'routing',
  'config-public-private',
  'generated-api-client',
  'ui-states',
  'error-boundary',
  'accessibility',
  'observability',
  'tests',
  'build',
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
 * Classifies an error-envelope source. The canonical target is 'flat-envelope'
 * (ADR-048). Returns 'problem-details' | 'flat-envelope' | 'spring-apierror' | 'unknown'.
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
    observability: result(findFile(join(appDir, 'src'), 'logging.config.ts') ? STATUS.COMPLIANT : STATUS.MISSING, 'common/logging (structured, ADR-040)'),
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
  const requestLog = findFile(java, 'RequestLoggingFilter.java');
  const structuredLogs = appYml ? readFileSync(appYml, 'utf8').includes('structured') : false;
  return {
    'config-validated': result(appYml ? STATUS.PARTIAL : STATUS.MISSING, 'application.yml (no typed base config)'),
    'error-canonical': errorResult(shape),
    'correlation-id': result(correlationFilter ? STATUS.COMPLIANT : STATUS.MISSING, correlationFilter ? 'CorrelationIdFilter.java' : 'no correlation filter'),
    'health-liveness-readiness': result(healthController ? STATUS.COMPLIANT : STATUS.MISSING, healthController ? 'HealthController.java (/health, /health/live, /health/ready)' : 'actuator aggregate only'),
    openapi: result(findFile(java, 'OpenApiConfig.java') ? STATUS.COMPLIANT : STATUS.MISSING, 'springdoc OpenApiConfig'),
    migrations: result(existsSync(join(appDir, 'src', 'main', 'resources', 'db', 'migration')) ? STATUS.COMPLIANT : STATUS.MISSING, 'flyway db/migration'),
    'base-security': result(findFile(java, 'SecurityConfig.java') ? STATUS.COMPLIANT : STATUS.PARTIAL, 'SecurityConfig.java'),
    observability: result(structuredLogs && requestLog ? STATUS.COMPLIANT : (structuredLogs || requestLog ? STATUS.PARTIAL : STATUS.MISSING), 'structured logging + RequestLoggingFilter'),
  };
}

function result(status, evidence) { return { status, evidence, source: 'structural' }; }

/**
 * The error invariant is measured against the canonical flat `ApiErrorResponse`
 * envelope (ADR-048): anything that is not the flat envelope is `non-conformant`.
 */
function errorResult(shape) {
  const status = shape === 'flat-envelope' ? STATUS.COMPLIANT : STATUS.NON_CONFORMANT;
  return { status, evidence: `error shape: ${shape} (canonical target: flat-envelope)`, source: 'structural' };
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

/** Reads the merged dependency map of a generated app's package.json, or {}. */
function packageDeps(appDir) {
  try {
    const pkg = JSON.parse(readFileSync(join(appDir, 'package.json'), 'utf8'));
    return { ...pkg.dependencies, ...pkg.devDependencies };
  } catch { return {}; }
}

/** Reads the scripts of a generated app's package.json, or {}. */
function packageScripts(appDir) {
  try {
    return JSON.parse(readFileSync(join(appDir, 'package.json'), 'utf8')).scripts ?? {};
  } catch { return {}; }
}

/** Evaluates the base Web invariants of a generated Next.js application. */
function evaluateNextjsWeb(appDir) {
  const src = join(appDir, 'src');
  const app = join(src, 'app');
  const deps = packageDeps(appDir);
  const scripts = packageScripts(appDir);
  const hasClient = Boolean(deps['@enistere/api-client-fetch']);
  const a11y = Boolean(deps['jest-axe'] || deps['eslint-plugin-jsx-a11y']);
  return {
    routing: result(existsSync(app) ? STATUS.COMPLIANT : STATUS.MISSING, 'App Router (src/app)'),
    'config-public-private': result(findFile(src, 'public-config.ts') && findFile(src, 'server-config.ts') ? STATUS.COMPLIANT : STATUS.PARTIAL, 'public-config.ts + server-config.ts'),
    'generated-api-client': result(hasClient ? STATUS.COMPLIANT : STATUS.MISSING, hasClient ? '@enistere/api-client-fetch' : 'no generated client dependency'),
    'ui-states': result(findFile(app, 'loading.tsx') && findFile(app, 'error.tsx') && findFile(app, 'not-found.tsx') ? STATUS.COMPLIANT : STATUS.PARTIAL, 'loading.tsx + error.tsx + not-found.tsx'),
    'error-boundary': result(findFile(app, 'error.tsx') ? STATUS.COMPLIANT : STATUS.MISSING, 'app/error.tsx'),
    accessibility: result(a11y ? STATUS.COMPLIANT : STATUS.MISSING, a11y ? 'jest-axe / jsx-a11y' : 'no a11y tooling'),
    observability: result(findFile(src, 'logger.ts') ? STATUS.COMPLIANT : STATUS.MISSING, 'client logging'),
    tests: result(scripts.test ? STATUS.COMPLIANT : STATUS.MISSING, scripts['test:e2e'] ? 'test + test:e2e' : 'test'),
    build: result(scripts.build ? STATUS.COMPLIANT : STATUS.MISSING, 'build script'),
  };
}

/** Evaluates the base Web invariants of a generated Angular application. */
function evaluateAngularWeb(appDir) {
  const src = join(appDir, 'src');
  const deps = packageDeps(appDir);
  const scripts = packageScripts(appDir);
  const hasClient = Boolean(deps['@enistere/api-client-fetch']);
  return {
    routing: result(findFile(src, 'app.routes.ts') ? STATUS.COMPLIANT : STATUS.MISSING, 'app.routes.ts'),
    'config-public-private': result(findFile(src, 'api-config.ts') ? STATUS.PARTIAL : STATUS.MISSING, 'core/config/api-config.ts (no explicit public/private split)'),
    'generated-api-client': result(hasClient ? STATUS.COMPLIANT : STATUS.MISSING, hasClient ? '@enistere/api-client-fetch' : 'no generated client dependency'),
    'ui-states': result(findFile(src, 'error.component.ts') ? STATUS.PARTIAL : STATUS.MISSING, 'no loading/error/empty states at base'),
    'error-boundary': result(findFile(src, 'app-api-error.ts') || findFile(src, 'global-error-handler.ts') ? STATUS.COMPLIANT : STATUS.MISSING, 'global ErrorHandler / app-api-error'),
    accessibility: result(deps['@angular/cdk'] ? STATUS.PARTIAL : STATUS.MISSING, '@angular/cdk a11y'),
    observability: result(STATUS.MISSING, 'no client logging'),
    tests: result(scripts['test:ci'] || scripts.test ? STATUS.COMPLIANT : STATUS.MISSING, 'test:ci (Karma)'),
    build: result(scripts.build ? STATUS.COMPLIANT : STATUS.MISSING, 'build script'),
  };
}

/** Evaluates one generated Web application by runtime. */
export function evaluateWebApp({ appDir, runtime }) {
  const invariants = runtime === 'nextjs' ? evaluateNextjsWeb(appDir)
    : runtime === 'angular' ? evaluateAngularWeb(appDir)
      : null;
  if (!invariants) throw new Error(`Platform Contract Web evaluation unsupported for runtime: ${runtime}`);
  return invariants;
}

/**
 * The structural conformance level: a generated, evaluated app has reached
 * `Generatable`; `Bootable`/`Conformant` require the opt-in runtime runner.
 */
function structuralLevel() { return 'Generatable'; }

/** Evaluates one generated application by family/runtime, or null if its family is not yet evaluated. */
function evaluateByFamily(app, appDir) {
  if (app.kind === 'api') return { family: 'api', invariants: evaluateApiApp({ appDir, runtime: app.runtime }) };
  if (app.kind === 'web') return { family: 'web', invariants: evaluateWebApp({ appDir, runtime: app.runtime }) };
  return null; // Mobile is not evaluated yet.
}

/**
 * Builds the computed conformance record for a generated project across all
 * evaluated families (API, Web). Consumes the GenerationPlan only for
 * identity/digests; evidence is read from the generated tree — never from a
 * hand-written status.
 */
export function buildConformance({ plan, projectDir }) {
  const apps = [];
  for (const app of plan.applications) {
    const evaluated = evaluateByFamily(app, join(projectDir, app.appDir));
    if (!evaluated) continue;
    apps.push({
      id: app.id,
      kind: app.kind,
      runtime: app.runtime,
      family: evaluated.family,
      level: structuralLevel(),
      invariants: evaluated.invariants,
      nonConformant: Object.entries(evaluated.invariants)
        .filter(([, r]) => r.status === STATUS.NON_CONFORMANT || r.status === STATUS.MISSING)
        .map(([id]) => id),
    });
  }
  return {
    schemaVersion: '1',
    families: [...new Set(apps.map((a) => a.family))],
    contract: 'PLATFORM_CONTRACT.md',
    generatedFrom: { systemDigest: plan.systemDigest, resolutionDigest: plan.resolutionDigest, planDigest: plan.planDigest },
    evaluation: 'structural',
    apps,
  };
}
