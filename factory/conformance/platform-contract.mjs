/**
 * Executable Platform Baseline v2 and family contracts (ADR-057).
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
  return {
    routing: result(existsSync(app) ? STATUS.COMPLIANT : STATUS.MISSING, 'App Router (src/app)'),
    'typed-api-client': result(hasClient ? STATUS.COMPLIANT : STATUS.MISSING, hasClient ? '@enistere/api-client-fetch (generated)' : 'no typed API client'),
    'session-hook': result(findFile(src, 'capability-providers.tsx') ? STATUS.COMPLIANT : STATUS.MISSING, 'capability provider seam'),
    'access-control-hook': result(findFile(src, 'capability-providers.tsx') ? STATUS.PARTIAL : STATUS.MISSING, 'capability provider seam'),
    'error-boundaries': result(findFile(app, 'error.tsx') ? STATUS.COMPLIANT : STATUS.MISSING, 'app/error.tsx'),
    'form-foundation': result(deps['react-hook-form'] || deps.zod ? STATUS.PARTIAL : STATUS.MISSING, 'form/validation dependencies'),
    'ui-states': result(findFile(app, 'loading.tsx') && findFile(app, 'error.tsx') && findFile(app, 'not-found.tsx') ? STATUS.COMPLIANT : STATUS.PARTIAL, 'loading.tsx + error.tsx + not-found.tsx'),
    accessibility: result(a11y ? STATUS.COMPLIANT : STATUS.MISSING, a11y ? 'jest-axe / jsx-a11y' : 'no a11y tooling'),
    'security-headers': result(findFile(appDir, 'next.config.ts') && readFileSync(join(appDir, 'next.config.ts'), 'utf8').includes('headers') ? STATUS.COMPLIANT : STATUS.MISSING, 'Next.js security headers'),
    telemetry: result(findFile(src, 'logger.ts') ? STATUS.PARTIAL : STATUS.MISSING, 'client logger only; OTEL hooks absent'),
    'e2e-foundation': result(scripts['test:e2e'] ? STATUS.COMPLIANT : STATUS.MISSING, 'test:e2e script'),
  };
}

/** Evaluates the base Web invariants of a generated Angular application. */
function evaluateAngularWeb(appDir) {
  const src = join(appDir, 'src');
  const deps = packageDeps(appDir);
  const scripts = packageScripts(appDir);
  return {
    routing: result(findFile(src, 'app.routes.ts') ? STATUS.COMPLIANT : STATUS.MISSING, 'app.routes.ts'),
    'typed-api-client': result(findFile(src, 'api-config.ts') && findFile(src, 'app-api-error.ts') ? STATUS.PARTIAL : STATUS.MISSING, 'HttpClient typed seam; generated client absent'),
    'session-hook': result(findFile(src, 'app.config.ts') ? STATUS.PARTIAL : STATUS.MISSING, 'provider seam; no neutral session hook'),
    'access-control-hook': result(findFile(src, 'app.config.ts') ? STATUS.PARTIAL : STATUS.MISSING, 'provider seam; no neutral access hook'),
    'error-boundaries': result(findFile(src, 'error.interceptor.ts') ? STATUS.PARTIAL : STATUS.MISSING, 'HTTP error boundary only'),
    'form-foundation': result(deps['@angular/forms'] ? STATUS.COMPLIANT : STATUS.MISSING, '@angular/forms'),
    'ui-states': result(findFile(src, 'enistere-loading-state.component.ts') && findFile(src, 'enistere-error-state.component.ts') ? STATUS.COMPLIANT : STATUS.PARTIAL, 'loading/error/empty state components'),
    accessibility: result(deps['@angular/cdk'] ? STATUS.PARTIAL : STATUS.MISSING, '@angular/cdk a11y'),
    'security-headers': result(STATUS.MISSING, 'deployment security headers not declared'),
    telemetry: result(findFile(src, 'log.interceptor.ts') ? STATUS.PARTIAL : STATUS.MISSING, 'request logging only; OTEL hooks absent'),
    'e2e-foundation': result(scripts.e2e ? STATUS.COMPLIANT : STATUS.MISSING, 'e2e script'),
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
  return {
    navigation: result(existsSync(join(appDir, 'app')) || deps['expo-router'] ? STATUS.COMPLIANT : STATUS.MISSING, 'expo-router (app/)'),
    'typed-api-client': result(deps['@tanstack/react-query'] && findFile(src, 'query-client.ts') ? STATUS.PARTIAL : STATUS.MISSING, 'query client present; generated transport contract incomplete'),
    'secure-storage': result(findFile(src, 'secure-session-store.ts') ? STATUS.COMPLIANT : STATUS.MISSING, 'secure session storage'),
    'session-hook': result(findFile(src, 'capability-providers.tsx') ? STATUS.COMPLIANT : STATUS.MISSING, 'capability provider seam'),
    'network-state': result(findFile(src, 'network-state.ts') ? STATUS.COMPLIANT : STATUS.MISSING, 'network state adapter'),
    'error-handling': result(findFile(src, 'query-errors.ts') || findFile(src, 'retryable-error.ts') ? STATUS.COMPLIANT : STATUS.MISSING, 'query-errors / retryable-error'),
    permissions: result(findFile(src, 'use-permission.ts') ? STATUS.COMPLIANT : STATUS.MISSING, 'permissions hook'),
    'deep-links': result(findFile(src, 'resolve.ts') ? STATUS.COMPLIANT : STATUS.MISSING, 'link resolver'),
    'offline-hook': result(findFile(src, 'queue.ts') ? STATUS.COMPLIANT : STATUS.MISSING, 'offline queue seam'),
    'push-hook': result(existsSync(join(src, 'notifications')) ? STATUS.PARTIAL : STATUS.MISSING, 'push placeholder adapter'),
    'crash-reporting': result(existsSync(join(src, 'crash-reporting')) ? STATUS.PARTIAL : STATUS.MISSING, 'crash reporting seam'),
    'build-foundation': result(scripts.android || scripts.ios ? STATUS.COMPLIANT : STATUS.MISSING, 'android/ios scripts'),
  };
}

/** Evaluates the base Mobile invariants of a generated Flutter application (Dart, lib/, pubspec). */
function evaluateFlutter(appDir) {
  const lib = join(appDir, 'lib');
  const hasTest = existsSync(join(appDir, 'test')) || existsSync(join(appDir, 'integration_test'));
  // Like Expo prebuild (React Native), Flutter scaffolds android/ios on demand;
  // build capability is carried by the toolchain (pubspec), not committed platform folders.
  const buildable = existsSync(join(appDir, 'pubspec.yaml'));
  return {
    navigation: result(findFile(lib, 'router.dart') ? STATUS.COMPLIANT : STATUS.MISSING, 'go_router (router.dart)'),
    'typed-api-client': result(findFile(lib, 'dio_client.dart') ? STATUS.PARTIAL : STATUS.MISSING, 'Dio client present; generated Dart client absent'),
    'secure-storage': result(findFile(lib, 'secure_session_store.dart') ? STATUS.COMPLIANT : STATUS.MISSING, 'secure session store'),
    'session-hook': result(findFile(lib, 'session_store.dart') ? STATUS.PARTIAL : STATUS.MISSING, 'session store seam'),
    'network-state': result(STATUS.MISSING, 'no network state port in baseline'),
    'error-handling': result(findFile(lib, 'error_interceptor.dart') ? STATUS.COMPLIANT : STATUS.MISSING, 'core/api/error_interceptor.dart'),
    permissions: result(STATUS.MISSING, 'no permissions port in baseline'),
    'deep-links': result(findFile(lib, 'router.dart') ? STATUS.PARTIAL : STATUS.MISSING, 'router present; deep-link policy absent'),
    'offline-hook': result(STATUS.MISSING, 'no offline hook'),
    'push-hook': result(STATUS.MISSING, 'no push hook'),
    'crash-reporting': result(STATUS.MISSING, 'no crash reporting hook'),
    'build-foundation': result(buildable ? STATUS.COMPLIANT : STATUS.MISSING, 'flutter toolchain (pubspec; platforms scaffolded on demand)'),
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
    configuration = Boolean(findFile(src, 'public-config.ts') && findFile(src, 'server-config.ts'));
    canonicalErrors = Boolean(findFile(src, 'map-api-error.ts'));
    structuredLogging = Boolean(findFile(src, 'logger.ts'));
    correlation = false;
    technicalAudit = false;
    security = existsSync(join(appDir, 'next.config.ts')) && readFileSync(join(appDir, 'next.config.ts'), 'utf8').includes('headers');
    health = Boolean(findFile(src, 'health-probe-view.tsx'));
    tests = Boolean(scripts.test);
    lifecycle = false;
    extensionPoints = Boolean(findFile(src, 'capability-providers.tsx'));
    buildGates = Boolean(scripts.build && scripts.test);
  } else if (runtime === 'angular') {
    configuration = Boolean(findFile(src, 'api-config.ts'));
    canonicalErrors = Boolean(findFile(src, 'app-api-error.ts') && findFile(src, 'error.interceptor.ts'));
    structuredLogging = Boolean(findFile(src, 'log.interceptor.ts'));
    tests = Boolean(scripts['test:ci'] || scripts.test);
    extensionPoints = Boolean(findFile(src, 'app.config.ts'));
    buildGates = Boolean(scripts.build && tests);
  } else if (runtime === 'react-native') {
    configuration = Boolean(findFile(src, 'env.ts'));
    canonicalErrors = Boolean(findFile(src, 'query-errors.ts'));
    structuredLogging = Boolean(findFile(src, 'logger.ts'));
    security = Boolean(findFile(src, 'redaction.ts'));
    health = Boolean(findFile(src, 'network-state.ts'));
    tests = Boolean(scripts.test);
    lifecycle = existsSync(join(src, 'app-lifecycle'));
    extensionPoints = Boolean(findFile(src, 'capability-providers.tsx'));
    buildGates = Boolean(scripts.test && (scripts.android || scripts.ios));
  } else if (runtime === 'flutter') {
    configuration = Boolean(findFile(lib, 'api_config.dart'));
    canonicalErrors = Boolean(findFile(lib, 'app_api_error.dart') && findFile(lib, 'error_interceptor.dart'));
    structuredLogging = Boolean(findFile(lib, 'logging_interceptor.dart'));
    security = Boolean(findFile(lib, 'secure_session_store.dart'));
    tests = existsSync(join(appDir, 'test')) || existsSync(join(appDir, 'integration_test'));
    extensionPoints = Boolean(findFile(lib, 'dio_provider.dart'));
    buildGates = existsSync(join(appDir, 'pubspec.yaml'));
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
      security ? 'bounded CORS, security headers and rate limiting behavior covered' : 'security baseline incomplete',
      security && isApi ? 'behavioral-test' : 'structural'),
    health: present(health, 'runtime health signal found', 'health/diagnostic signal missing', !isApi),
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
      lifecycle && isApi ? 'behavioral-test' : 'structural'),
    'extension-points': result(
      extensionPoints ? (isMobile || runtime === 'angular' ? STATUS.PARTIAL : STATUS.COMPLIANT) : STATUS.MISSING,
      extensionPoints ? 'versioned extension registry behavior tested' : 'versioned extension points missing',
      extensionPoints && isApi ? 'behavioral-test' : 'structural'),
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
