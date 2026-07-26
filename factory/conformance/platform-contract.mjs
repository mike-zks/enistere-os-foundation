/**
 * Executable Platform Baseline v2 and family contracts (ADR-057).
 *
 * Evaluates a generated application (API, Web, Mobile) against the common invariants of
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
import { fileURLToPath } from 'node:url';

const CONTRACT_PATH = fileURLToPath(new URL('./contracts/platform-baseline.v2.json', import.meta.url));
const parsedContract = JSON.parse(readFileSync(CONTRACT_PATH, 'utf8'));
const contractIssues = validatePlatformBaselineContract(parsedContract);
if (contractIssues.length) throw new Error(`Platform Baseline contract invalid:\n- ${contractIssues.join('\n- ')}`);
export const PLATFORM_BASELINE_CONTRACT = Object.freeze(parsedContract);

export function validatePlatformBaselineContract(value) {
  const issues = [];
  if (value?.schemaVersion !== '1') issues.push('schemaVersion must be 1');
  if (value?.id !== 'platform-baseline') issues.push('id must be platform-baseline');
  if (value?.version !== '2.0.0') issues.push('version must be 2.0.0');
  const contracts = [['common', value?.common], ...['api', 'web', 'mobile'].map((family) => [family, value?.families?.[family]])];
  for (const [id, contract] of contracts) {
    const expected = `${id}/2.0.0`;
    if (contract?.contractVersion !== expected) issues.push(`${id}.contractVersion must be ${expected}`);
    if (!Array.isArray(contract?.invariants) || contract.invariants.length === 0) issues.push(`${id}.invariants must be non-empty`);
    else {
      if (new Set(contract.invariants).size !== contract.invariants.length) issues.push(`${id}.invariants must be unique`);
      if (contract.invariants.some((item) => !/^[a-z][a-z0-9-]*$/.test(item))) issues.push(`${id}.invariants contain an invalid id`);
    }
  }
  return issues;
}

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
export const COMMON_BASELINE_INVARIANTS = Object.freeze([...PLATFORM_BASELINE_CONTRACT.common.invariants]);
export const API_CONTRACT_INVARIANTS = Object.freeze([...PLATFORM_BASELINE_CONTRACT.families.api.invariants]);

/**
 * The minimal Web base Platform Contract invariants (ADR-050, refined ADR-051),
 * asserted structurally and measured IDIOMATICALLY per framework: parity means the
 * same contract (typed API access, canonical error handling, UI states), not the
 * same library (Next.js: api-client-fetch; Angular: HttpClient + interceptors).
 */
export const WEB_CONTRACT_INVARIANTS = Object.freeze([...PLATFORM_BASELINE_CONTRACT.families.web.invariants]);

/** The minimal Mobile base Platform Contract invariants (ADR-052), asserted structurally. */
export const MOBILE_CONTRACT_INVARIANTS = Object.freeze([...PLATFORM_BASELINE_CONTRACT.families.mobile.invariants]);

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
  const extensionContract = findFile(join(appDir, 'src'), 'runtime-extension.contract.ts');
  const extensionProof = findFile(join(appDir, 'src'), 'runtime-extension.contract.spec.ts');
  const extensionsProven = Boolean(extensionContract && extensionProof);
  const lifecycleProven = readContains(appDir, 'main.ts', 'enableShutdownHooks')
    && Boolean(findFile(join(appDir, 'src'), 'runtime-lifecycle.service.ts'))
    && Boolean(findFile(join(appDir, 'src'), 'runtime-lifecycle.service.spec.ts'));
  const persistencePort = findFile(join(appDir, 'src'), 'persistence.port.ts');
  const transactionPort = findFile(join(appDir, 'src'), 'transaction.port.ts');
  const transactionAdapter = findFile(join(appDir, 'src'), 'prisma-transaction.adapter.ts');
  const transactionProof = findFile(join(appDir, 'src'), 'prisma-transaction.adapter.spec.ts');
  const health = ops.includes('health_live') && ops.includes('health_ready')
    ? STATUS.COMPLIANT
    : ops.includes('health_get') ? STATUS.PARTIAL : STATUS.MISSING;
  return {
    'http-server': result(findFile(join(appDir, 'src'), 'main.ts') ? STATUS.COMPLIANT : STATUS.MISSING, 'NestJS bootstrap'),
    'input-validation': result(findFile(join(appDir, 'src'), 'configure-app.ts') ? STATUS.COMPLIANT : STATUS.MISSING, 'global validation pipe'),
    'canonical-http-errors': errorResult(shape),
    openapi: result(ops.length ? STATUS.COMPLIANT : STATUS.MISSING, `${ops.length} operations`),
    'health-liveness-readiness': result(health, `openapi ops: ${ops.filter((o) => o.startsWith('health')).join(', ') || 'none'}`),
    'persistence-ports': result(
      persistencePort && findFile(join(appDir, 'src'), 'prisma.service.ts') ? STATUS.COMPLIANT : STATUS.MISSING,
      'neutral PersistencePort with Prisma adapter infrastructure'),
    'migration-ports': result(existsSync(join(appDir, 'prisma', 'migrations')) ? STATUS.COMPLIANT : STATUS.MISSING, 'prisma/migrations'),
    'transaction-ports': result(
      transactionPort && transactionAdapter && transactionProof ? STATUS.COMPLIANT : STATUS.MISSING,
      transactionPort && transactionAdapter
        ? 'neutral TransactionPort with Prisma adapter behavior tested'
        : 'neutral transaction port or adapter missing',
      transactionProof ? 'behavioral-test' : 'structural'),
    'authentication-hook': result(extensionsProven ? STATUS.COMPLIANT : STATUS.MISSING, extensionsProven ? 'versioned AuthenticationHook registry behavior tested' : 'versioned AuthenticationHook missing', extensionsProven ? 'behavioral-test' : 'structural'),
    'authorization-hook': result(extensionsProven ? STATUS.COMPLIANT : STATUS.MISSING, extensionsProven ? 'versioned AuthorizationHook registry behavior tested' : 'versioned AuthorizationHook missing', extensionsProven ? 'behavioral-test' : 'structural'),
    'file-hook': result(extensionsProven ? STATUS.COMPLIANT : STATUS.MISSING, extensionsProven ? 'versioned FileHook registry behavior tested' : 'versioned FileHook missing', extensionsProven ? 'behavioral-test' : 'structural'),
    'event-hook': result(extensionsProven ? STATUS.COMPLIANT : STATUS.MISSING, extensionsProven ? 'versioned EventHook registry behavior tested' : 'versioned EventHook missing', extensionsProven ? 'behavioral-test' : 'structural'),
    'graceful-shutdown': result(lifecycleProven ? STATUS.COMPLIANT : STATUS.MISSING, lifecycleProven ? 'signal hooks and idempotent reverse shutdown behavior tested' : 'graceful shutdown proof missing', lifecycleProven ? 'behavioral-test' : 'structural'),
    'contract-tests': result(existsSync(join(appDir, 'test')) ? STATUS.COMPLIANT : STATUS.MISSING, 'API contract/e2e tests'),
    'rate-limiting': result(findFile(join(appDir, 'src'), 'throttling.module.ts') ? STATUS.COMPLIANT : STATUS.MISSING, 'common/throttling (base mechanism)'),
  };
}

/** Evaluates the invariants of a generated Spring API application. */
function evaluateSpring(appDir) {
  const java = join(appDir, 'src', 'main', 'java');
  const errorFile = findFile(java, 'ApiError.java');
  const shape = errorFile ? classifyErrorShape(readFileSync(errorFile, 'utf8')) : 'unknown';
  const healthController = findFile(java, 'HealthController.java');
  const appYml = findFile(join(appDir, 'src', 'main', 'resources'), 'application.yml');
  const extensionContract = findFile(java, 'RuntimeExtension.java');
  const extensionProof = findFile(join(appDir, 'src', 'test'), 'RuntimeExtensionRegistryTest.java');
  const extensionsProven = Boolean(
    extensionContract && extensionProof
    && findFile(java, 'AuthenticationHook.java')
    && findFile(java, 'AuthorizationHook.java')
    && findFile(java, 'FileHook.java')
    && findFile(java, 'EventHook.java'));
  const lifecycleProven = Boolean(
    appYml && readFileSync(appYml, 'utf8').includes('shutdown: graceful')
    && findFile(java, 'RuntimeLifecycle.java')
    && findFile(join(appDir, 'src', 'test'), 'RuntimeLifecycleTest.java'));
  const validationPort = findFile(java, 'InputValidationPort.java');
  const validationAdapter = findFile(java, 'JakartaInputValidationAdapter.java');
  const validationProof = findFile(join(appDir, 'src', 'test'), 'JakartaInputValidationAdapterTest.java');
  const persistencePort = findFile(java, 'PersistencePort.java');
  const transactionPort = findFile(java, 'TransactionPort.java');
  const transactionAdapter = findFile(java, 'SpringTransactionAdapter.java');
  const transactionProof = findFile(join(appDir, 'src', 'test'), 'SpringTransactionAdapterTest.java');
  return {
    'http-server': result(findFile(java, 'EnistereCoreApplication.java') ? STATUS.COMPLIANT : STATUS.MISSING, 'Spring Boot application'),
    'input-validation': result(
      validationPort && validationAdapter && validationProof && findFile(java, 'GlobalExceptionHandler.java')
        ? STATUS.COMPLIANT : STATUS.MISSING,
      'neutral InputValidationPort, Jakarta adapter and canonical HTTP mapping behavior tested',
      validationProof ? 'behavioral-test' : 'structural'),
    'canonical-http-errors': errorResult(shape),
    openapi: result(findFile(java, 'OpenApiConfig.java') ? STATUS.COMPLIANT : STATUS.MISSING, 'springdoc OpenApiConfig'),
    'health-liveness-readiness': result(healthController ? STATUS.COMPLIANT : STATUS.MISSING, healthController ? 'HealthController.java (/health, /health/live, /health/ready)' : 'actuator aggregate only'),
    'persistence-ports': result(
      persistencePort && findFile(java, 'BaseEntity.java') ? STATUS.COMPLIANT : STATUS.MISSING,
      'neutral PersistencePort with JPA adapter infrastructure'),
    'migration-ports': result(existsSync(join(appDir, 'src', 'main', 'resources', 'db', 'migration')) ? STATUS.COMPLIANT : STATUS.MISSING, 'flyway db/migration'),
    'transaction-ports': result(
      transactionPort && transactionAdapter && transactionProof ? STATUS.COMPLIANT : STATUS.MISSING,
      transactionPort && transactionAdapter
        ? 'neutral TransactionPort with Spring adapter behavior tested'
        : 'neutral transaction port or adapter missing',
      transactionProof ? 'behavioral-test' : 'structural'),
    'authentication-hook': result(extensionsProven ? STATUS.COMPLIANT : STATUS.MISSING, extensionsProven ? 'versioned AuthenticationHook registry behavior tested' : 'versioned AuthenticationHook missing', extensionsProven ? 'behavioral-test' : 'structural'),
    'authorization-hook': result(extensionsProven ? STATUS.COMPLIANT : STATUS.MISSING, extensionsProven ? 'versioned AuthorizationHook registry behavior tested' : 'versioned AuthorizationHook missing', extensionsProven ? 'behavioral-test' : 'structural'),
    'file-hook': result(extensionsProven ? STATUS.COMPLIANT : STATUS.MISSING, extensionsProven ? 'versioned FileHook registry behavior tested' : 'versioned FileHook missing', extensionsProven ? 'behavioral-test' : 'structural'),
    'event-hook': result(extensionsProven ? STATUS.COMPLIANT : STATUS.MISSING, extensionsProven ? 'versioned EventHook registry behavior tested' : 'versioned EventHook missing', extensionsProven ? 'behavioral-test' : 'structural'),
    'graceful-shutdown': result(lifecycleProven ? STATUS.COMPLIANT : STATUS.MISSING, lifecycleProven ? 'graceful timeout and idempotent reverse shutdown behavior tested' : 'graceful shutdown proof missing', lifecycleProven ? 'behavioral-test' : 'structural'),
    'contract-tests': result(extensionProof && findFile(join(appDir, 'src', 'test'), 'SecurityHeadersFilterTest.java') ? STATUS.COMPLIANT : existsSync(join(appDir, 'src', 'test')) ? STATUS.PARTIAL : STATUS.MISSING, 'API baseline behavioral contract tests'),
    'rate-limiting': result(findFile(java, 'RateLimiter.java') ? STATUS.COMPLIANT : STATUS.MISSING, 'infrastructure/ratelimit (base mechanism)'),
  };
}

/** Evaluates the invariants of a generated FastAPI application. */
function evaluateFastapi(appDir) {
  const app = join(appDir, 'app');
  const tests = join(appDir, 'tests');
  const main = readOptional(join(app, 'main.py'));
  const platform = readOptional(join(app, 'platform.py'));
  const httpProof = readOptional(join(tests, 'test_http_contract.py'));
  const platformProof = readOptional(join(tests, 'test_platform.py'));
  const shape = classifyErrorShape(main);
  const extensionsProven = [
    'AUTHENTICATION', 'AUTHORIZATION', 'FILES', 'EVENTS',
  ].every((token) => platform.includes(token))
    && platform.includes('API_EXTENSION_CONTRACT_VERSION')
    && platformProof.includes('test_extension_registry_is_versioned_and_exclusive');
  const lifecycleProven = platform.includes('RuntimeLifecycle')
    && platform.includes('runtime_lifespan')
    && platformProof.includes('test_lifecycle_stops_hooks_once_in_reverse_order');
  const persistencePort = platform.includes('class PersistencePort(Protocol');
  const migrationPort = platform.includes('class MigrationPort(Protocol');
  const transactionPort = platform.includes('class TransactionPort(Protocol');
  return {
    'http-server': result(main.includes('FastAPI(') ? STATUS.COMPLIANT : STATUS.MISSING, 'FastAPI ASGI application'),
    'input-validation': result(
      platform.includes('InputValidationPort')
        && main.includes('RequestValidationError')
        && httpProof.includes('canonical_validation_error')
        ? STATUS.COMPLIANT : STATUS.MISSING,
      'neutral validation port and canonical FastAPI validation mapping tested',
      'behavioral-test'),
    'canonical-http-errors': errorResult(shape),
    openapi: result(
      main.includes('operation_id=') && httpProof.includes('/openapi.json')
        ? STATUS.COMPLIANT : STATUS.MISSING,
      'FastAPI OpenAPI publication behavior tested',
      'behavioral-test'),
    'health-liveness-readiness': result(
      ['/health"', '/health/live"', '/health/ready"'].every((path) => main.includes(path))
        && httpProof.includes('test_health_http_contract')
        ? STATUS.COMPLIANT : STATUS.MISSING,
      'health, liveness and readiness HTTP behavior tested',
      'behavioral-test'),
    'persistence-ports': result(persistencePort ? STATUS.COMPLIANT : STATUS.MISSING, 'provider-neutral PersistencePort'),
    'migration-ports': result(
      migrationPort && existsSync(join(appDir, 'migrations'))
        ? STATUS.COMPLIANT : STATUS.MISSING,
      'provider-neutral MigrationPort and governed migrations location'),
    'transaction-ports': result(
      transactionPort ? STATUS.COMPLIANT : STATUS.MISSING,
      'provider-neutral TransactionPort'),
    'authentication-hook': result(extensionsProven ? STATUS.COMPLIANT : STATUS.MISSING, 'versioned AuthenticationHook registry behavior tested', 'behavioral-test'),
    'authorization-hook': result(extensionsProven ? STATUS.COMPLIANT : STATUS.MISSING, 'versioned AuthorizationHook registry behavior tested', 'behavioral-test'),
    'file-hook': result(extensionsProven ? STATUS.COMPLIANT : STATUS.MISSING, 'versioned FileHook registry behavior tested', 'behavioral-test'),
    'event-hook': result(extensionsProven ? STATUS.COMPLIANT : STATUS.MISSING, 'versioned EventHook registry behavior tested', 'behavioral-test'),
    'graceful-shutdown': result(
      lifecycleProven ? STATUS.COMPLIANT : STATUS.MISSING,
      'ASGI lifespan and idempotent reverse shutdown behavior tested',
      'behavioral-test'),
    'contract-tests': result(
      httpProof && platformProof ? STATUS.COMPLIANT : STATUS.MISSING,
      'API baseline behavioral contract tests',
      'behavioral-test'),
    'rate-limiting': result(
      main.includes('rate_limit_per_minute') && httpProof.includes('test_rate_limit_and_security_headers_are_enforced')
        ? STATUS.COMPLIANT : STATUS.MISSING,
      'bounded in-memory baseline rate limiter behavior tested',
      'behavioral-test'),
  };
}

function result(status, evidence, source = 'structural') { return { status, evidence, source }; }

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
      : runtime === 'fastapi' ? evaluateFastapi(appDir)
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
  const runtimeContract = readOptional(findFile(src, 'runtime-contract.ts'));
  const runtimeProof = readOptional(findFile(join(appDir, 'test'), 'runtime-contract.test.ts'));
  const formFoundation = findFile(src, 'form-foundation.ts');
  const formProof = findFile(join(appDir, 'test'), 'form-foundation.test.ts');
  const securityProof = readOptional(findFile(join(appDir, 'e2e'), 'health.spec.ts'));
  const extensionsProven = runtimeContract.includes('WebRuntimeExtensionRegistry')
    && runtimeProof.includes('session and access-control extension points are versioned and exclusive');
  const telemetryProven = runtimeContract.includes('RuntimeTelemetry')
    && runtimeProof.includes('telemetry exporter is versioned');
  return {
    routing: result(existsSync(app) ? STATUS.COMPLIANT : STATUS.MISSING, 'App Router (src/app)'),
    'typed-api-client': result(hasClient ? STATUS.COMPLIANT : STATUS.MISSING, hasClient ? '@enistere/api-client-fetch (generated)' : 'no typed API client'),
    'session-hook': result(extensionsProven ? STATUS.COMPLIANT : STATUS.MISSING, 'versioned neutral session extension behavior tested', extensionsProven ? 'behavioral-test' : 'structural'),
    'access-control-hook': result(extensionsProven ? STATUS.COMPLIANT : STATUS.MISSING, 'versioned neutral access-control extension behavior tested', extensionsProven ? 'behavioral-test' : 'structural'),
    'error-boundaries': result(findFile(app, 'error.tsx') ? STATUS.COMPLIANT : STATUS.MISSING, 'app/error.tsx'),
    'form-foundation': result(formFoundation && formProof ? STATUS.COMPLIANT : STATUS.MISSING, 'typed framework-neutral form validation behavior tested', formProof ? 'behavioral-test' : 'structural'),
    'ui-states': result(findFile(app, 'loading.tsx') && findFile(app, 'error.tsx') && findFile(app, 'not-found.tsx') ? STATUS.COMPLIANT : STATUS.PARTIAL, 'loading.tsx + error.tsx + not-found.tsx'),
    accessibility: result(a11y ? STATUS.COMPLIANT : STATUS.MISSING, a11y ? 'jest-axe / jsx-a11y' : 'no a11y tooling'),
    'security-headers': result(
      findFile(appDir, 'next.config.ts')
        && readFileSync(join(appDir, 'next.config.ts'), 'utf8').includes('headers')
        && securityProof.includes('x-content-type-options')
        ? STATUS.COMPLIANT : STATUS.MISSING,
      'Next.js security headers exercised by E2E contract',
      'behavioral-test'),
    telemetry: result(telemetryProven ? STATUS.COMPLIANT : STATUS.MISSING, 'versioned telemetry exporter, metrics and W3C behavior tested', telemetryProven ? 'behavioral-test' : 'structural'),
    'e2e-foundation': result(scripts['test:e2e'] ? STATUS.COMPLIANT : STATUS.MISSING, 'test:e2e script'),
  };
}

/** Evaluates the base Web invariants of a generated Angular application. */
function evaluateAngularWeb(appDir) {
  const src = join(appDir, 'src');
  const deps = packageDeps(appDir);
  const scripts = packageScripts(appDir);
  const runtimeContract = readOptional(findFile(src, 'runtime-contract.ts'));
  const runtimeProof = readOptional(findFile(src, 'runtime-contract.spec.ts'));
  const extensionsProven = runtimeContract.includes('WebRuntimeExtensionRegistry')
    && runtimeProof.includes('session and access-control extensions versioned and exclusive');
  const typedClientProven = Boolean(findFile(src, 'typed-api-client.ts') && findFile(src, 'typed-api-client.spec.ts'));
  const errorBoundaryProven = Boolean(findFile(src, 'runtime.providers.ts') && findFile(src, 'runtime.providers.spec.ts'));
  const formProven = Boolean(findFile(src, 'form-foundation.ts') && findFile(src, 'form-foundation.spec.ts'));
  const accessibilityProven = Boolean(
    deps['@angular/cdk']
    && findFile(src, 'enistere-loading-state.component.spec.ts')
    && findFile(src, 'enistere-error-state.component.spec.ts'));
  const securityProven = existsSync(join(appDir, 'public', '_headers'))
    && Boolean(findFile(join(appDir, 'e2e'), 'runtime-contract.test.mjs'));
  const telemetryProven = runtimeContract.includes('RuntimeTelemetry')
    && runtimeProof.includes('versioned telemetry');
  return {
    routing: result(findFile(src, 'app.routes.ts') ? STATUS.COMPLIANT : STATUS.MISSING, 'app.routes.ts'),
    'typed-api-client': result(typedClientProven ? STATUS.COMPLIANT : STATUS.MISSING, 'typed Angular HttpClient facade behavior tested', typedClientProven ? 'behavioral-test' : 'structural'),
    'session-hook': result(extensionsProven ? STATUS.COMPLIANT : STATUS.MISSING, 'versioned neutral session extension behavior tested', extensionsProven ? 'behavioral-test' : 'structural'),
    'access-control-hook': result(extensionsProven ? STATUS.COMPLIANT : STATUS.MISSING, 'versioned neutral access-control extension behavior tested', extensionsProven ? 'behavioral-test' : 'structural'),
    'error-boundaries': result(errorBoundaryProven ? STATUS.COMPLIANT : STATUS.MISSING, 'HTTP mapping and global ErrorHandler behavior tested', errorBoundaryProven ? 'behavioral-test' : 'structural'),
    'form-foundation': result(
      deps['@angular/forms'] && formProven ? STATUS.COMPLIANT : STATUS.MISSING,
      'Reactive Forms foundation behavior tested',
      formProven ? 'behavioral-test' : 'structural'),
    'ui-states': result(findFile(src, 'enistere-loading-state.component.ts') && findFile(src, 'enistere-error-state.component.ts') ? STATUS.COMPLIANT : STATUS.PARTIAL, 'loading/error/empty state components'),
    accessibility: result(accessibilityProven ? STATUS.COMPLIANT : STATUS.MISSING, 'Angular CDK and accessible UI-state behavior tested', accessibilityProven ? 'behavioral-test' : 'structural'),
    'security-headers': result(securityProven ? STATUS.COMPLIANT : STATUS.MISSING, 'deployable security-header policy exercised by E2E contract', securityProven ? 'behavioral-test' : 'structural'),
    telemetry: result(telemetryProven ? STATUS.COMPLIANT : STATUS.MISSING, 'versioned telemetry exporter, metrics and W3C behavior tested', telemetryProven ? 'behavioral-test' : 'structural'),
    'e2e-foundation': result(scripts['test:e2e'] && securityProven ? STATUS.COMPLIANT : STATUS.MISSING, 'booted runtime E2E contract script'),
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

/** Evaluates the base Mobile invariants of a generated React Native application. */
function evaluateReactNative(appDir) {
  const src = join(appDir, 'src');
  const deps = packageDeps(appDir);
  const scripts = packageScripts(appDir);
  const proof = readOptional(findFile(join(appDir, 'test'), 'mobile-runtime-contract.test.ts'));
  const commonProof = proof.includes('mobile extension points are versioned and exclusive');
  const apiProof = proof.includes('typed API client propagates request context and maps canonical errors');
  const hooksProof = proof.includes('neutral session/offline/push hooks expose no capability behavior');
  return {
    navigation: result(
      existsSync(join(appDir, 'app')) && deps['expo-router'] ? STATUS.COMPLIANT : STATUS.MISSING,
      'Expo Router filesystem navigation foundation'),
    'typed-api-client': result(
      findFile(src, 'typed-api-client.ts') && apiProof ? STATUS.COMPLIANT : STATUS.MISSING,
      'typed transport propagates correlation and maps canonical errors',
      apiProof ? 'behavioral-test' : 'structural'),
    'secure-storage': result(
      findFile(src, 'secure-storage-port.ts') && hooksProof ? STATUS.COMPLIANT : STATUS.MISSING,
      'versioned secure-storage port rejects unsafe keys',
      hooksProof ? 'behavioral-test' : 'structural'),
    'session-hook': result(
      findFile(src, 'session-hook.ts') && commonProof && hooksProof ? STATUS.COMPLIANT : STATUS.MISSING,
      'neutral versioned session hook and exclusive extension slot',
      hooksProof ? 'behavioral-test' : 'structural'),
    'network-state': result(
      findFile(src, 'network-state.ts') && findFile(join(appDir, 'test'), 'network-state.test.ts')
        ? STATUS.COMPLIANT : STATUS.MISSING,
      'network-state transitions behavior tested',
      'behavioral-test'),
    'error-handling': result(
      findFile(src, 'typed-api-client.ts') && apiProof ? STATUS.COMPLIANT : STATUS.MISSING,
      'canonical mobile errors behavior tested',
      apiProof ? 'behavioral-test' : 'structural'),
    permissions: result(
      findFile(src, 'use-permission.ts') && findFile(join(appDir, 'test'), 'permission-engine.test.ts')
        ? STATUS.COMPLIANT : STATUS.MISSING,
      'permission port and safe state transitions behavior tested',
      'behavioral-test'),
    'deep-links': result(
      findFile(src, 'resolve.ts') && findFile(join(appDir, 'test'), 'linking-resolve.test.ts')
        ? STATUS.COMPLIANT : STATUS.MISSING,
      'deep-link allowlist and open-redirect policy behavior tested',
      'behavioral-test'),
    'offline-hook': result(
      findFile(src, 'offline-hook.ts') && hooksProof ? STATUS.COMPLIANT : STATUS.MISSING,
      'disabled-by-default versioned offline hook',
      hooksProof ? 'behavioral-test' : 'structural'),
    'push-hook': result(
      findFile(src, 'push-hook.ts') && hooksProof
        && !findFile(join(src, 'notifications'), 'engine.ts')
        ? STATUS.COMPLIANT : STATUS.MISSING,
      'disabled-by-default versioned push hook without Notifications capability',
      hooksProof ? 'behavioral-test' : 'structural'),
    'crash-reporting': result(
      findFile(src, 'engine.ts') && findFile(join(appDir, 'test'), 'crash-reporting-engine.test.ts')
        ? STATUS.COMPLIANT : STATUS.MISSING,
      'sanitized crash-reporting adapter behavior tested',
      'behavioral-test'),
    'build-foundation': result(
      scripts.android && scripts.ios && scripts.build && scripts.doctor
        ? STATUS.COMPLIANT : STATUS.MISSING,
      'Expo Android/iOS, doctor and export gates declared'),
  };
}

/** Evaluates the base Mobile invariants of a generated Flutter application (Dart, lib/, pubspec). */
function evaluateFlutter(appDir) {
  const lib = join(appDir, 'lib');
  const proof = readOptional(findFile(join(appDir, 'test'), 'mobile_runtime_contract_test.dart'));
  const commonProof = proof.includes('mobile extension points are versioned and exclusive');
  const apiProof = proof.includes('typed API client propagates correlation and maps canonical errors');
  const hooksProof = proof.includes('neutral mobile hooks expose no capability behavior');
  const manifest = readOptional(join(appDir, 'starter.manifest.json'));
  const buildable = existsSync(join(appDir, 'pubspec.yaml'))
    && existsSync(join(appDir, 'android'))
    && manifest.includes('"flutter", "build", "apk"');
  return {
    navigation: result(
      findFile(lib, 'router.dart') && readOptional(join(appDir, 'pubspec.yaml')).includes('go_router')
        ? STATUS.COMPLIANT : STATUS.MISSING,
      'GoRouter navigation foundation'),
    'typed-api-client': result(
      findFile(lib, 'typed_api_client.dart') && apiProof ? STATUS.COMPLIANT : STATUS.MISSING,
      'typed transport propagates correlation and maps canonical errors',
      apiProof ? 'behavioral-test' : 'structural'),
    'secure-storage': result(
      findFile(lib, 'secure_storage.dart') && hooksProof ? STATUS.COMPLIANT : STATUS.MISSING,
      'versioned secure-storage port rejects unsafe keys',
      hooksProof ? 'behavioral-test' : 'structural'),
    'session-hook': result(
      findFile(lib, 'session_hook.dart') && commonProof && hooksProof ? STATUS.COMPLIANT : STATUS.MISSING,
      'neutral versioned session hook and exclusive extension slot',
      hooksProof ? 'behavioral-test' : 'structural'),
    'network-state': result(
      findFile(lib, 'network_state.dart') && hooksProof ? STATUS.COMPLIANT : STATUS.MISSING,
      'neutral network-state hook behavior tested',
      hooksProof ? 'behavioral-test' : 'structural'),
    'error-handling': result(
      findFile(lib, 'typed_api_client.dart') && apiProof ? STATUS.COMPLIANT : STATUS.MISSING,
      'canonical mobile errors behavior tested',
      apiProof ? 'behavioral-test' : 'structural'),
    permissions: result(
      findFile(lib, 'permission_hook.dart') && hooksProof ? STATUS.COMPLIANT : STATUS.MISSING,
      'permission port is disabled safely until an adapter is composed',
      hooksProof ? 'behavioral-test' : 'structural'),
    'deep-links': result(
      findFile(lib, 'deep_link_policy.dart') && hooksProof ? STATUS.COMPLIANT : STATUS.MISSING,
      'deep-link scheme/host allowlist behavior tested',
      hooksProof ? 'behavioral-test' : 'structural'),
    'offline-hook': result(
      findFile(lib, 'offline_hook.dart') && hooksProof ? STATUS.COMPLIANT : STATUS.MISSING,
      'disabled-by-default versioned offline hook',
      hooksProof ? 'behavioral-test' : 'structural'),
    'push-hook': result(
      findFile(lib, 'push_hook.dart') && hooksProof ? STATUS.COMPLIANT : STATUS.MISSING,
      'disabled-by-default versioned push hook without Notifications capability',
      hooksProof ? 'behavioral-test' : 'structural'),
    'crash-reporting': result(
      findFile(lib, 'crash_reporting_hook.dart') && hooksProof ? STATUS.COMPLIANT : STATUS.MISSING,
      'disabled-by-default versioned crash-reporting hook',
      hooksProof ? 'behavioral-test' : 'structural'),
    'build-foundation': result(
      buildable ? STATUS.COMPLIANT : STATUS.MISSING,
      'Flutter Android platform and APK build gate declared'),
  };
}

/** Evaluates one generated Mobile application by runtime. */
export function evaluateMobileApp({ appDir, runtime }) {
  const invariants = runtime === 'react-native' ? evaluateReactNative(appDir)
    : runtime === 'flutter' ? evaluateFlutter(appDir)
      : null;
  if (!invariants) throw new Error(`Platform Contract Mobile evaluation unsupported for runtime: ${runtime}`);
  return invariants;
}

function present(value, compliantEvidence, missingEvidence, partial = false) {
  return result(value ? (partial ? STATUS.PARTIAL : STATUS.COMPLIANT) : STATUS.MISSING, value ? compliantEvidence : missingEvidence);
}

/**
 * Evaluates the Common Runtime Contract once for every runtime. The contract is
 * intentionally stricter than the former "base" measurement: a logger alone is
 * only PARTIAL observability because metrics, traces and propagation are also
 * required by Platform Baseline v2.
 */
export function evaluateCommonBaseline({ appDir, runtime }) {
  const src = join(appDir, 'src');
  const lib = join(appDir, 'lib');
  const java = join(src, 'main', 'java');
  const resources = join(src, 'main', 'resources');
  const scripts = packageScripts(appDir);
  const isApi = runtime === 'nestjs' || runtime === 'spring' || runtime === 'fastapi';
  const isWeb = runtime === 'nextjs' || runtime === 'angular';
  const isMobile = runtime === 'react-native' || runtime === 'flutter';

  let configuration = false;
  let canonicalErrors = false;
  let structuredLogging = false;
  let correlation = false;
  let observability = false;
  let observabilityProven = false;
  let technicalAudit = false;
  let security = false;
  let health = false;
  let tests = false;
  let lifecycle = false;
  let extensionPoints = false;
  let buildGates = false;
  let configurationProven = false;
  let diagnosticsProven = false;
  let buildGatesProven = false;
  let healthProven = false;
  let extensionPointsProven = false;

  if (runtime === 'nestjs') {
    configuration = Boolean(findFile(src, 'env.validation.ts'));
    canonicalErrors = classifyErrorShape(readOptional(findFile(src, 'all-exceptions.filter.ts'))) === 'flat-envelope';
    structuredLogging = Boolean(findFile(src, 'logging.config.ts'));
    correlation = Boolean(findFile(src, 'request-id.middleware.ts'));
    technicalAudit = Boolean(findFile(src, 'audit.service.ts'));
    observability = Boolean(
      findFile(src, 'runtime-telemetry.service.ts')
      && findFile(src, 'runtime-observability.module.ts')
      && readContains(appDir, 'request-context.middleware.ts', 'recordRequest'));
    observabilityProven = observability
      && Boolean(findFile(src, 'runtime-telemetry.service.spec.ts'))
      && readOptional(findFile(join(appDir, 'test'), 'app.e2e-spec.ts')).includes('continues a valid W3C trace');
    security = Boolean(
      readContains(appDir, 'configure-app.ts', 'helmet')
      && findFile(src, 'throttling.module.ts')
      && readOptional(findFile(join(appDir, 'test'), 'app.e2e-spec.ts')).includes('applies security headers'));
    health = Boolean(findFile(src, 'health.controller.ts'));
    tests = existsSync(join(appDir, 'test'));
    lifecycle = Boolean(
      readContains(appDir, 'main.ts', 'enableShutdownHooks')
      && findFile(src, 'runtime-lifecycle.service.ts')
      && findFile(src, 'runtime-lifecycle.service.spec.ts'));
    extensionPoints = Boolean(
      findFile(src, 'runtime-extension.contract.ts')
      && findFile(src, 'runtime-extension.contract.spec.ts'));
    buildGates = Boolean(scripts.build && scripts.test);
    configurationProven = configuration && Boolean(findFile(src, 'env.validation.spec.ts'));
    diagnosticsProven = Boolean(
      findFile(src, 'runtime-diagnostics.service.ts')
      && findFile(src, 'runtime-diagnostics.service.spec.ts'));
    buildGatesProven = buildGates;
  } else if (runtime === 'spring') {
    const appYml = findFile(resources, 'application.yml');
    configuration = Boolean(appYml && findFile(java, 'PlatformProperties.java'));
    canonicalErrors = classifyErrorShape(readOptional(findFile(java, 'ApiError.java'))) === 'flat-envelope';
    structuredLogging = readOptional(appYml).includes('structured') && Boolean(findFile(java, 'RequestLoggingFilter.java'));
    correlation = Boolean(findFile(java, 'CorrelationIdFilter.java'));
    technicalAudit = Boolean(findFile(java, 'AuditService.java'));
    observability = Boolean(
      findFile(java, 'TelemetryPort.java')
      && findFile(java, 'MicrometerTelemetryAdapter.java')
      && findFile(java, 'OpenTelemetryHook.java')
      && findFile(java, 'RequestTelemetryFilter.java'));
    observabilityProven = observability
      && Boolean(findFile(join(src, 'test'), 'TraceContextTest.java'))
      && Boolean(findFile(join(src, 'test'), 'MicrometerTelemetryAdapterTest.java'))
      && Boolean(findFile(join(src, 'test'), 'RequestTelemetryFilterTest.java'));
    security = Boolean(
      findFile(java, 'CorsConfig.java')
      && findFile(java, 'WebMvcConfig.java')
      && findFile(java, 'SecurityHeadersFilter.java')
      && findFile(join(src, 'test'), 'SecurityHeadersFilterTest.java')
      && findFile(join(src, 'test'), 'CorsConfigTest.java'));
    health = Boolean(findFile(java, 'HealthController.java'));
    tests = existsSync(join(src, 'test'));
    lifecycle = Boolean(
      readOptional(appYml).includes('shutdown: graceful')
      && findFile(java, 'RuntimeLifecycle.java')
      && findFile(join(src, 'test'), 'RuntimeLifecycleTest.java'));
    extensionPoints = Boolean(
      findFile(java, 'RuntimeExtensionRegistry.java')
      && findFile(join(src, 'test'), 'RuntimeExtensionRegistryTest.java'));
    const pom = readOptional(join(appDir, 'pom.xml'));
    buildGates = Boolean(pom);
    configurationProven = configuration
      && Boolean(findFile(join(src, 'test'), 'PlatformPropertiesTest.java'));
    diagnosticsProven = Boolean(
      findFile(java, 'RuntimeDiagnostics.java')
      && findFile(join(src, 'test'), 'RuntimeDiagnosticsTest.java'));
    buildGatesProven = buildGates
      && pom.includes('maven-enforcer-plugin')
      && pom.includes('maven-surefire-plugin');
  } else if (runtime === 'fastapi') {
    const app = join(appDir, 'app');
    const testsDir = join(appDir, 'tests');
    const config = readOptional(join(app, 'config.py'));
    const main = readOptional(join(app, 'main.py'));
    const platform = readOptional(join(app, 'platform.py'));
    const httpProof = readOptional(join(testsDir, 'test_http_contract.py'));
    const platformProof = readOptional(join(testsDir, 'test_platform.py'));
    const pyproject = readOptional(join(appDir, 'pyproject.toml'));
    configuration = config.includes('BaseSettings') && config.includes('Field(');
    configurationProven = configuration && platformProof.includes('test_configuration_is_typed');
    canonicalErrors = classifyErrorShape(main) === 'flat-envelope';
    structuredLogging = main.includes('http.request.completed') && main.includes('json.dumps');
    correlation = main.includes('SAFE_REQUEST_ID') && httpProof.includes('X-Request-Id');
    technicalAudit = platform.includes('class TechnicalAudit')
      && platformProof.includes('test_technical_audit_emits_structured_context_without_payload');
    observability = platform.includes('class OpenTelemetryExporter')
      && platform.includes('class RuntimeTelemetry')
      && main.includes('telemetry.record');
    observabilityProven = observability
      && platformProof.includes('test_opentelemetry_hook_is_versioned')
      && platformProof.includes('test_continues_w3c_trace_with_a_new_span');
    security = main.includes('CORSMiddleware')
      && main.includes('X-Content-Type-Options')
      && main.includes('rate_limit_per_minute')
      && httpProof.includes('test_rate_limit_and_security_headers_are_enforced');
    health = ['/health"', '/health/live"', '/health/ready"'].every((path) => main.includes(path));
    tests = Boolean(httpProof && platformProof);
    lifecycle = platform.includes('runtime_lifespan')
      && platformProof.includes('test_lifecycle_stops_hooks_once_in_reverse_order');
    extensionPoints = platform.includes('class RuntimeExtensionRegistry')
      && platformProof.includes('test_extension_registry_is_versioned_and_exclusive');
    buildGates = pyproject.includes('[tool.pytest.ini_options]')
      && pyproject.includes('[tool.ruff]')
      && existsSync(join(appDir, 'requirements.lock'))
      && existsSync(join(appDir, 'requirements.runtime.lock'))
      && readOptional(join(appDir, 'requirements.txt')).includes('pip-audit==')
      && platformProof.includes('test_requirements_lock_covers_every_direct_dependency');
    buildGatesProven = buildGates;
    diagnosticsProven = platform.includes('class RuntimeDiagnostics')
      && platformProof.includes('test_diagnostics_are_sorted_and_sanitized');
  } else if (runtime === 'nextjs') {
    const runtimeContract = readOptional(findFile(src, 'runtime-contract.ts'));
    const runtimeProof = readOptional(findFile(join(appDir, 'test'), 'runtime-contract.test.ts'));
    configuration = Boolean(findFile(src, 'public-config.ts') && findFile(src, 'server-config.ts'));
    canonicalErrors = Boolean(findFile(src, 'map-api-error.ts'));
    structuredLogging = runtimeContract.includes('class StructuredLogger')
      && runtimeProof.includes('structured logging and technical audit redact sensitive fields');
    correlation = runtimeContract.includes('withRequestContext')
      && runtimeProof.includes('continues a valid W3C trace with a new span');
    technicalAudit = runtimeContract.includes('class TechnicalAudit')
      && runtimeProof.includes('technical audit redact sensitive fields');
    observability = runtimeContract.includes('class RuntimeTelemetry')
      && runtimeContract.includes('TELEMETRY_EXPORTER_CONTRACT_VERSION');
    observabilityProven = observability
      && runtimeProof.includes('telemetry exporter is versioned')
      && runtimeProof.includes('continues a valid W3C trace');
    security = existsSync(join(appDir, 'next.config.ts'))
      && readFileSync(join(appDir, 'next.config.ts'), 'utf8').includes('headers')
      && readOptional(findFile(join(appDir, 'e2e'), 'health.spec.ts')).includes('x-content-type-options');
    health = Boolean(findFile(src, 'health-probe-view.tsx') && runtimeContract.includes('RuntimeDiagnostics'));
    healthProven = health && runtimeProof.includes('diagnostics are sorted');
    tests = Boolean(scripts.test);
    lifecycle = runtimeContract.includes('class RuntimeLifecycle')
      && runtimeProof.includes('lifecycle starts in order and stops once in reverse order');
    extensionPoints = runtimeContract.includes('class WebRuntimeExtensionRegistry');
    extensionPointsProven = extensionPoints
      && runtimeProof.includes('session and access-control extension points are versioned and exclusive');
    buildGates = Boolean(scripts.build && scripts.test);
    configurationProven = configuration
      && Boolean(findFile(join(appDir, 'test'), 'public-config.test.ts'))
      && Boolean(findFile(join(appDir, 'test'), 'api-config.test.ts'));
    diagnosticsProven = healthProven;
    buildGatesProven = buildGates && Boolean(scripts.typecheck && scripts.lint && scripts['test:e2e']);
  } else if (runtime === 'angular') {
    const runtimeContract = readOptional(findFile(src, 'runtime-contract.ts'));
    const runtimeProof = readOptional(findFile(src, 'runtime-contract.spec.ts'));
    const e2eProof = readOptional(findFile(join(appDir, 'e2e'), 'runtime-contract.test.mjs'));
    configuration = readOptional(findFile(src, 'api-config.ts')).includes('validateApiBaseUrl');
    canonicalErrors = Boolean(findFile(src, 'app-api-error.ts') && findFile(src, 'error.interceptor.ts'));
    structuredLogging = runtimeContract.includes('class StructuredLogger')
      && runtimeProof.includes('redacts technical audit fields');
    correlation = Boolean(findFile(src, 'correlation.interceptor.ts'))
      && Boolean(findFile(src, 'correlation.interceptor.spec.ts'))
      && runtimeProof.includes('continues W3C context');
    technicalAudit = runtimeContract.includes('class TechnicalAudit')
      && runtimeProof.includes('redacts technical audit fields');
    observability = runtimeContract.includes('class RuntimeTelemetry')
      && runtimeContract.includes('TELEMETRY_EXPORTER_CONTRACT_VERSION');
    observabilityProven = observability
      && runtimeProof.includes('versioned telemetry')
      && Boolean(findFile(src, 'log.interceptor.spec.ts'));
    security = existsSync(join(appDir, 'public', '_headers'))
      && e2eProof.includes('security headers');
    health = runtimeContract.includes('class RuntimeDiagnostics')
      && e2eProof.includes('baseline boots');
    healthProven = health;
    tests = Boolean(scripts['test:ci'] || scripts.test);
    lifecycle = runtimeContract.includes('class RuntimeLifecycle')
      && runtimeProof.includes('stops idempotently in reverse order')
      && Boolean(findFile(src, 'runtime.providers.spec.ts'));
    extensionPoints = runtimeContract.includes('class WebRuntimeExtensionRegistry');
    extensionPointsProven = extensionPoints
      && runtimeProof.includes('session and access-control extensions versioned and exclusive');
    buildGates = Boolean(scripts.build && tests);
    configurationProven = configuration && Boolean(findFile(src, 'api-config.spec.ts'));
    diagnosticsProven = healthProven && runtimeProof.includes('sorts diagnostics');
    buildGatesProven = buildGates && Boolean(scripts['test:e2e']);
  } else if (runtime === 'react-native') {
    const runtimeContract = readOptional(findFile(src, 'runtime-contract.ts'));
    const runtimeProof = readOptional(findFile(join(appDir, 'test'), 'mobile-runtime-contract.test.ts'));
    configuration = runtimeContract.includes('validateRuntimeConfiguration');
    configurationProven = configuration
      && runtimeProof.includes('validates typed public configuration and production transport');
    canonicalErrors = runtimeContract.includes('mapCanonicalMobileError')
      && runtimeProof.includes('maps canonical errors');
    structuredLogging = Boolean(findFile(src, 'logger.ts'))
      && runtimeProof.includes('structured logging and technical audit redact sensitive fields');
    correlation = runtimeContract.includes('createMobileRequestContext')
      && runtimeProof.includes('continues valid W3C context with a new span');
    technicalAudit = runtimeContract.includes('class TechnicalAudit')
      && runtimeProof.includes('technical audit redact sensitive fields');
    observability = runtimeContract.includes('class RuntimeTelemetry')
      && runtimeContract.includes('TELEMETRY_EXPORTER_CONTRACT_VERSION');
    observabilityProven = observability
      && runtimeProof.includes('versioned telemetry records metrics and propagates correlation');
    security = Boolean(findFile(src, 'redaction.ts'))
      && runtimeProof.includes('production transport')
      && runtimeProof.includes('redact sensitive fields');
    health = runtimeContract.includes('class RuntimeDiagnostics')
      && Boolean(findFile(src, 'network-state.ts'));
    healthProven = health && runtimeProof.includes('diagnostics are sorted');
    tests = Boolean(scripts.test);
    lifecycle = runtimeContract.includes('class RuntimeLifecycle')
      && runtimeProof.includes('lifecycle stops once in reverse order');
    extensionPoints = runtimeContract.includes('class MobileRuntimeExtensionRegistry');
    extensionPointsProven = extensionPoints
      && runtimeProof.includes('mobile extension points are versioned and exclusive');
    diagnosticsProven = healthProven;
    buildGates = Boolean(
      scripts.test && scripts.typecheck && scripts.lint
      && scripts.doctor && scripts.build && scripts.android && scripts.ios);
    buildGatesProven = buildGates;
  } else if (runtime === 'flutter') {
    const runtimeContract = readOptional(findFile(lib, 'runtime_contract.dart'));
    const runtimeProof = readOptional(findFile(join(appDir, 'test'), 'mobile_runtime_contract_test.dart'));
    const manifest = readOptional(join(appDir, 'starter.manifest.json'));
    configuration = runtimeContract.includes('class RuntimeConfiguration');
    configurationProven = configuration
      && runtimeProof.includes('validates typed configuration and production transport');
    canonicalErrors = runtimeContract.includes('class CanonicalMobileError')
      && runtimeProof.includes('maps canonical errors');
    structuredLogging = runtimeContract.includes('class StructuredLogger')
      && runtimeProof.includes('structured logging and technical audit redact sensitive fields');
    correlation = runtimeContract.includes('class MobileRequestContext')
      && runtimeProof.includes('continues W3C context with a new span');
    technicalAudit = runtimeContract.includes('class TechnicalAudit')
      && runtimeProof.includes('technical audit redact sensitive fields');
    observability = runtimeContract.includes('class RuntimeTelemetry')
      && runtimeContract.includes('telemetryExporterContractVersion');
    observabilityProven = observability
      && runtimeProof.includes('versioned telemetry records metrics and correlation');
    security = runtimeProof.includes('production transport')
      && runtimeProof.includes('redact sensitive fields');
    health = runtimeContract.includes('class RuntimeDiagnostics')
      && Boolean(findFile(lib, 'network_state.dart'));
    healthProven = health && runtimeProof.includes('diagnostics are sorted');
    tests = Boolean(runtimeProof);
    lifecycle = runtimeContract.includes('class RuntimeLifecycle')
      && runtimeProof.includes('lifecycle stops once in reverse order');
    extensionPoints = runtimeContract.includes('class MobileRuntimeExtensionRegistry');
    extensionPointsProven = extensionPoints
      && runtimeProof.includes('mobile extension points are versioned and exclusive');
    diagnosticsProven = healthProven;
    buildGates = existsSync(join(appDir, 'pubspec.yaml'))
      && existsSync(join(appDir, 'analysis_options.yaml'))
      && existsSync(join(appDir, 'android'))
      && manifest.includes('"flutter", "analyze"')
      && manifest.includes('"flutter", "test"')
      && manifest.includes('"flutter", "build", "apk"');
    buildGatesProven = buildGates;
  } else {
    throw new Error(`Platform Baseline evaluation unsupported for runtime: ${runtime}`);
  }

  const diagnostics = canonicalErrors && health;
  return {
    configuration: result(
      configurationProven || (configuration && runtime === 'nestjs')
        ? STATUS.COMPLIANT
        : configuration
          ? (runtime === 'spring' || runtime === 'angular' || runtime === 'flutter'
            ? STATUS.PARTIAL : STATUS.COMPLIANT)
          : STATUS.MISSING,
      configurationProven
        ? 'typed configuration validation behavior tested'
        : configuration ? 'validated/typed configuration seam found' : 'validated configuration missing',
      configurationProven ? 'behavioral-test' : 'structural'),
    'canonical-errors': present(canonicalErrors, 'canonical error mapping found', 'canonical error mapping missing'),
    'structured-logging': present(structuredLogging, 'structured request logging found', 'structured logging missing'),
    correlation: present(correlation, 'correlation propagation seam found', 'correlation propagation missing'),
    observability: result(
      observabilityProven ? STATUS.COMPLIANT : structuredLogging || observability ? STATUS.PARTIAL : STATUS.MISSING,
      observabilityProven
        ? 'request metrics, W3C trace propagation and versioned OpenTelemetry hook behavior tested'
        : structuredLogging || observability
          ? 'observability components incomplete or without behavioral proof'
          : 'logs/metrics/traces baseline missing',
      observabilityProven ? 'behavioral-test' : 'structural'),
    'technical-audit': present(technicalAudit, 'technical audit service/sink found', 'technical audit infrastructure missing'),
    'security-baseline': result(
      security ? STATUS.COMPLIANT : STATUS.MISSING,
      security
        ? isApi
          ? 'bounded CORS, security headers and rate limiting behavior covered'
          : isWeb
            ? 'deployable security headers exercised by an E2E contract'
            : 'production transport validation and sensitive-data redaction behavior tested'
        : 'security baseline incomplete',
      security ? 'behavioral-test' : 'structural'),
    health: present(health, 'runtime health signal found', 'health/diagnostic signal missing', !isApi && !healthProven),
    diagnostics: result(
      diagnosticsProven ? STATUS.COMPLIANT : diagnostics ? STATUS.PARTIAL : STATUS.MISSING,
      diagnosticsProven
        ? 'sanitized diagnostics registry behavior tested'
        : diagnostics ? 'canonical errors and health provide partial diagnostics' : 'structured actionable diagnostics missing',
      diagnosticsProven ? 'behavioral-test' : 'structural'),
    'testing-foundation': present(tests, 'test foundation found', 'test foundation missing'),
    'lifecycle-hooks': result(
      lifecycle ? STATUS.COMPLIANT : isWeb ? STATUS.PARTIAL : STATUS.MISSING,
      lifecycle ? 'runtime lifecycle transitions and shutdown hooks behavior tested' : 'lifecycle hooks missing',
      lifecycle && (isApi || isWeb || isMobile) ? 'behavioral-test' : 'structural'),
    'extension-points': result(
      extensionPoints ? (extensionPointsProven ? STATUS.COMPLIANT : isMobile ? STATUS.PARTIAL : STATUS.COMPLIANT) : STATUS.MISSING,
      extensionPoints ? 'versioned extension registry behavior tested' : 'versioned extension points missing',
      extensionPointsProven || (extensionPoints && isApi) ? 'behavioral-test' : 'structural'),
    'build-quality-gates': result(
      buildGatesProven ? STATUS.COMPLIANT
        : buildGates ? (runtime === 'spring' || runtime === 'flutter' ? STATUS.PARTIAL : STATUS.COMPLIANT)
          : STATUS.MISSING,
      buildGatesProven
        ? 'build, test and toolchain quality gates explicitly declared'
        : buildGates ? 'build/test gates found' : 'build and quality gates missing',
      'structural'),
  };
}

function readOptional(path) {
  return path && existsSync(path) ? readFileSync(path, 'utf8') : '';
}

/**
 * The structural conformance level: a generated, evaluated app has reached
 * `Generatable`; `Bootable`/`Conformant` require the opt-in runtime runner.
 */
function structuralLevel() { return 'GENERATABLE'; }

/** Evaluates one generated application by family/runtime, or null if its family is not yet evaluated. */
function evaluateByFamily(app, appDir) {
  if (app.kind === 'api') return { family: 'api', invariants: evaluateApiApp({ appDir, runtime: app.runtime }) };
  if (app.kind === 'web') return { family: 'web', invariants: evaluateWebApp({ appDir, runtime: app.runtime }) };
  if (app.kind === 'mobile') return { family: 'mobile', invariants: evaluateMobileApp({ appDir, runtime: app.runtime }) };
  return null;
}

/**
 * Builds the computed conformance record for a generated project across all
 * evaluated families (API, Web, Mobile). Consumes the GenerationPlan only for
 * identity/digests; evidence is read from the generated tree — never from a
 * hand-written status.
 */
export function buildConformance({ plan, projectDir }) {
  const apps = [];
  for (const app of plan.applications) {
    const appDir = join(projectDir, app.appDir);
    const evaluated = evaluateByFamily(app, appDir);
    if (!evaluated) continue;
    const baselineInvariants = evaluateCommonBaseline({ appDir, runtime: app.runtime });
    const nonConformant = (scope, invariants) => Object.entries(invariants)
      .filter(([, r]) => r.status === STATUS.NON_CONFORMANT || r.status === STATUS.MISSING)
      .map(([id]) => `${scope}.${id}`);
    const diagnostics = (scope, invariants) => Object.entries(invariants)
      .filter(([, r]) => r.status !== STATUS.COMPLIANT)
      .map(([id, r]) => ({
        code: r.status === STATUS.PARTIAL
          ? `${scope === 'baseline' ? 'BASELINE' : 'FAMILY'}_INVARIANT_PARTIAL`
          : `${scope === 'baseline' ? 'BASELINE' : 'FAMILY'}_REQUIRED_INVARIANT_MISSING`,
        severity: r.status === STATUS.PARTIAL ? 'warning' : 'error',
        path: `apps.${app.id}.${scope}.${id}`,
        invariant: id,
        status: r.status,
        evidence: r.evidence,
      }));
    const expectedBaselineVersion = PLATFORM_BASELINE_CONTRACT.version;
    const expectedFamilyVersion = PLATFORM_BASELINE_CONTRACT.families[evaluated.family].contractVersion;
    const contractDiagnostics = [];
    if (app.baseline?.contractVersion !== expectedBaselineVersion) {
      contractDiagnostics.push({
        code: 'BASELINE_CONTRACT_VERSION_MISMATCH',
        severity: 'error',
        path: `apps.${app.id}.baseline.contractVersion`,
        expected: expectedBaselineVersion,
        actual: app.baseline?.contractVersion ?? null,
      });
    }
    if (app.baseline?.familyContract !== expectedFamilyVersion) {
      contractDiagnostics.push({
        code: 'FAMILY_CONTRACT_VERSION_MISMATCH',
        severity: 'error',
        path: `apps.${app.id}.baseline.familyContract`,
        expected: expectedFamilyVersion,
        actual: app.baseline?.familyContract ?? null,
      });
    }
    apps.push({
      id: app.id,
      kind: app.kind,
      runtime: app.runtime,
      family: evaluated.family,
      level: structuralLevel(),
      baseline: {
        contractVersion: PLATFORM_BASELINE_CONTRACT.common.contractVersion,
        invariants: baselineInvariants,
      },
      familyContract: {
        contractVersion: PLATFORM_BASELINE_CONTRACT.families[evaluated.family].contractVersion,
        invariants: evaluated.invariants,
      },
      nonConformant: [
        ...contractDiagnostics.map((entry) => entry.path),
        ...nonConformant('baseline', baselineInvariants),
        ...nonConformant(evaluated.family, evaluated.invariants),
      ],
      diagnostics: [
        ...contractDiagnostics,
        ...diagnostics('baseline', baselineInvariants),
        ...diagnostics(evaluated.family, evaluated.invariants),
      ],
    });
  }
  return {
    schemaVersion: '2',
    families: [...new Set(apps.map((a) => a.family))],
    contract: {
      id: PLATFORM_BASELINE_CONTRACT.id,
      version: PLATFORM_BASELINE_CONTRACT.version,
      source: 'factory/conformance/contracts/platform-baseline.v2.json',
    },
    generatedFrom: { systemDigest: plan.systemDigest, resolutionDigest: plan.resolutionDigest, planDigest: plan.planDigest },
    evaluation: 'structural',
    apps,
  };
}
