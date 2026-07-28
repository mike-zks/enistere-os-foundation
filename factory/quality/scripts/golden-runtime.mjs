#!/usr/bin/env node
/**
 * golden-runtime.mjs — Capability Packs 1A-R : génère une composition golden dans
 * un répertoire temporaire, prouve l'installation reproductible (`npm install`
 * puis `npm ci`) et exécute les gates réels de chaque application générée.
 *
 * Usage :
 *   node factory/quality/scripts/golden-runtime.mjs <composition> [--keep] [--outDir <dir>]
 *
 * Compositions :
 *   nestjs-base           nestjs, base
 *   nestjs-auth           nestjs, base+auth
 *   nest-next-auth        nestjs + nextjs, base+auth
 *   triple-auth           nestjs + nextjs + react-native, base+auth
 *   nestjs-auth-rbac      nestjs, base+auth+rbac
 *   nest-next-auth-rbac   nestjs + nextjs, base+auth+rbac
 *   triple-auth-rbac      nestjs + nextjs + react-native, base+auth+rbac (RBAC non applicable au mobile)
 *   nestjs-files          nestjs, base+auth+rbac+files
 *   nest-next-files       nestjs + nextjs, base+auth+rbac+files
 *   triple-files          nestjs + nextjs + react-native, base+auth+rbac+files
 *
 * R8A — compositions `base` seul, nommées d'après leur profil :
 *   spring-base                 spring
 *   fastapi-base                fastapi
 *   spring-auth                 spring, base+auth
 *   spring-next-base            spring + nextjs
 *   spring-react-native-base    spring + react-native
 *   spring-angular-base         spring + angular
 *   spring-flutter-base         spring + flutter
 *   nestjs-next-base            nestjs + nextjs
 *   nestjs-react-native-base    nestjs + react-native
 *   nestjs-angular-base         nestjs + angular
 *   nestjs-flutter-base         nestjs + flutter
 *   distributed-spring-nestjs   distributed-platform, Spring + NestJS
 *
 * Gates DB (prisma migrate, e2e NestJS) exécutés uniquement si DATABASE_URL est
 * défini. Aucun secret réel : la CI fournit des valeurs jetables via l'env.
 *
 * `GOLDEN_RUNTIME_START=1` ajoute la preuve de démarrage réel. Pour une API,
 * health/live/ready, corrélation, W3C et sécurité sont vérifiés sur le processus
 * lancé. Les cibles mobiles n'ont pas de démarrage vérifiable sans émulateur et
 * sont explicitement déclarées comme telles.
 */
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateProject } from '../../engine/generator.mjs';
import { createDefaultBlueprint } from '../../engine/blueprint.mjs';
import { finalizeDependencies, verifyProjectDependencies } from '../../engine/dependencies.mjs';
import { verifyMaterializedCapabilities } from '../../conformance/capability-product.mjs';
import { createHash } from 'node:crypto';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const AUDIT_CHECK = resolve(REPO_ROOT, 'factory/quality/scripts/audit-check.mjs');

// Safe, non-secret test placeholders so schema-only gates (prisma
// generate/validate, openapi:check booting AppModule) run without a real DB or
// real secrets. The CI provides its own disposable values via the environment,
// which take precedence. Live DB gates (migrate, e2e) are gated by
// GOLDEN_RUNTIME_DB=1 and a reachable DATABASE_URL.
const TEST_ENV_DEFAULTS = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder?schema=public',
  JWT_ACCESS_SECRET: 'golden_runtime_test_access_secret_min_32_chars',
  JWT_REFRESH_SECRET: 'golden_runtime_test_refresh_secret_min_32_chars',
  REFRESH_TOKEN_HASH_SECRET: 'golden_runtime_test_hash_secret_min_32_chars',
  S3_ENDPOINT: 'http://127.0.0.1:9000',
  S3_REGION: 'us-east-1',
  S3_ACCESS_KEY_ID: 'golden_runtime_test_access_key',
  S3_SECRET_ACCESS_KEY: 'golden_runtime_test_secret_key',
  S3_BUCKET: 'enistere-golden-files',
  S3_FORCE_PATH_STYLE: 'true',
};
for (const [key, value] of Object.entries(TEST_ENV_DEFAULTS)) {
  if (!process.env[key]) process.env[key] = value;
}

// Karma (Angular) resolves its browser through CHROME_BIN. The CI provides it;
// locally we point at whichever Chrome/Chromium is installed rather than letting
// the gate fail for a reason unrelated to the generated project.
if (!process.env.CHROME_BIN) {
  for (const candidate of ['google-chrome', 'chromium', 'chromium-browser']) {
    const found = spawnSync('command', ['-v', candidate], { encoding: 'utf8', shell: true });
    if (found.status === 0 && found.stdout.trim()) { process.env.CHROME_BIN = found.stdout.trim(); break; }
  }
}

export const COMPOSITIONS = {
  'nestjs-base': { stack: { api: 'nestjs', web: null, mobile: null }, capabilities: [] },
  'nestjs-auth': { stack: { api: 'nestjs', web: null, mobile: null }, capabilities: ['auth'] },
  'nest-next-auth': { stack: { api: 'nestjs', web: 'nextjs', mobile: null }, capabilities: ['auth'] },
  'triple-auth': { stack: { api: 'nestjs', web: 'nextjs', mobile: 'react-native' }, capabilities: ['auth'] },
  // RBAC (1B) : NestJS + Next.js consomment RBAC ; React Native reste sur base + auth
  // (`not-applicable`) sans recevoir la moindre surface RBAC.
  'nestjs-auth-rbac': { stack: { api: 'nestjs', web: null, mobile: null }, capabilities: ['auth', 'rbac'] },
  'nest-next-auth-rbac': { stack: { api: 'nestjs', web: 'nextjs', mobile: null }, capabilities: ['auth', 'rbac'] },
  'triple-auth-rbac': { stack: { api: 'nestjs', web: 'nextjs', mobile: 'react-native' }, capabilities: ['auth', 'rbac'] },
  'nestjs-files': { stack: { api: 'nestjs', web: null, mobile: null }, capabilities: ['auth', 'rbac', 'files'] },
  'nest-next-files': { stack: { api: 'nestjs', web: 'nextjs', mobile: null }, capabilities: ['auth', 'rbac', 'files'] },
  'triple-files': { stack: { api: 'nestjs', web: 'nextjs', mobile: 'react-native' }, capabilities: ['auth', 'rbac', 'files'] },
  // R8A : compositions `base` seul. Nommées d'après leur profil, de sorte que le
  // lien golden ↔ profil soit une identité vérifiable et non une convention.
  // Chaque starter est une source modulaire unique à sa racine. Les capabilities
  // restent des overlays explicites ; une composition `base` est donc exacte.
  'spring-base': { stack: { api: 'spring', web: null, mobile: null }, capabilities: [] },
  'fastapi-base': { stack: { api: 'fastapi', web: null, mobile: null }, capabilities: [] },
  'spring-auth': { stack: { api: 'spring', web: null, mobile: null }, capabilities: ['auth'] },
  'spring-auth-rbac': { stack: { api: 'spring', web: null, mobile: null }, capabilities: ['auth', 'rbac'] },
  'spring-files': { stack: { api: 'spring', web: null, mobile: null }, capabilities: ['auth', 'rbac', 'files'] },
  'spring-next-base': { stack: { api: 'spring', web: 'nextjs', mobile: null }, capabilities: [] },
  'spring-react-native-base': { stack: { api: 'spring', web: null, mobile: 'react-native' }, capabilities: [] },
  'spring-angular-base': { stack: { api: 'spring', web: 'angular', mobile: null }, capabilities: [] },
  'spring-flutter-base': { stack: { api: 'spring', web: null, mobile: 'flutter' }, capabilities: [] },
  'nestjs-next-base': { stack: { api: 'nestjs', web: 'nextjs', mobile: null }, capabilities: [] },
  'nestjs-react-native-base': { stack: { api: 'nestjs', web: null, mobile: 'react-native' }, capabilities: [] },
  'nestjs-angular-base': { stack: { api: 'nestjs', web: 'angular', mobile: null }, capabilities: [] },
  'nestjs-flutter-base': { stack: { api: 'nestjs', web: null, mobile: 'flutter' }, capabilities: [] },
  'distributed-spring-nestjs': {
    applications: [
      {
        id: 'core-api',
        kind: 'api',
        runtime: 'spring',
        consumes: [],
        ownership: { team: 'core-team', domains: ['core'] },
      },
      {
        id: 'engagement-api',
        kind: 'api',
        runtime: 'nestjs',
        consumes: ['core-api'],
        ownership: { team: 'engagement-team', domains: ['engagement'] },
      },
    ],
    architecture: { profile: 'distributed-platform' },
    communications: [{
      id: 'engagement-to-core',
      from: 'engagement-api',
      to: 'core-api',
      mode: 'synchronous',
      protocol: 'http',
      contract: 'core-api.v1',
      timeoutMs: 2000,
      maxAttempts: 2,
      identity: 'workload',
      failurePolicy: 'fail-fast',
    }],
    capabilities: [],
  },
};

/** argv of the npm-audit-by-exception gate applied to every golden. */
export function auditGate(projectDir, kinds) {
  return ['node', [AUDIT_CHECK, projectDir, '--targets', [...kinds, 'shared-packages'].join(',')]];
}

/** Blueprint for a composition (shared by the driver and its tests). */
export function compositionBlueprint(composition, slug = `golden-${composition}`) {
  const spec = COMPOSITIONS[composition];
  if (!spec) throw new Error(`Unknown composition: ${composition}`);
  const blueprint = createDefaultBlueprint(slug);
  if (spec.applications) {
    delete blueprint.stack;
    blueprint.applications = spec.applications;
    blueprint.architecture = spec.architecture;
    blueprint.communications = spec.communications;
  } else {
    blueprint.stack = spec.stack;
  }
  blueprint.capabilities = spec.capabilities;
  blueprint.designSystem = true;
  blueprint.deployment = { environments: ['local'] };
  return blueprint;
}

function run(label, cmd, args, cwd, environment = process.env) {
  process.stdout.write(`\n── ${label}\n   $ ${cmd} ${args.join(' ')}  (cwd: ${cwd})\n`);
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: false, env: environment });
  if (result.status !== 0) {
    process.stdout.write(`\n❌ FAILED: ${label} (exit ${result.status ?? 'signal ' + result.signal})\n`);
    return false;
  }
  process.stdout.write(`✓ ${label}\n`);
  return true;
}

function dataNamespace(application) {
  return `authority_${application.id.replaceAll('-', '_')}`;
}

function withJdbcSchema(connection, schema) {
  if (!connection) return connection;
  const [base, query = ''] = connection.split('?', 2);
  const parameters = new URLSearchParams(query);
  parameters.set('currentSchema', schema);
  return `${base}?${parameters.toString()}`;
}

/**
 * Gives each distributed authority its own physical PostgreSQL namespace.
 * Sharing a server remains possible for the minimal golden, but sharing a
 * schema would violate bounded-context ownership and makes Prisma/Flyway
 * migration histories collide.
 */
export function runtimeEnvironmentFor(application, architectureProfileId, baseEnvironment = process.env) {
  const environment = { ...baseEnvironment };
  if (architectureProfileId !== 'distributed-platform' || !application.ownership) {
    return environment;
  }

  const namespace = dataNamespace(application);
  environment.ENISTERE_DATA_NAMESPACE = namespace;
  if (application.runtime === 'nestjs' && environment.DATABASE_URL) {
    const database = new URL(environment.DATABASE_URL);
    database.searchParams.set('schema', namespace);
    environment.DATABASE_URL = database.toString();
  }
  if (application.runtime === 'spring' && environment.SPRING_DATASOURCE_URL) {
    environment.SPRING_DATASOURCE_URL = withJdbcSchema(
      environment.SPRING_DATASOURCE_URL,
      namespace,
    );
  }
  return environment;
}

/**
 * Database/schema preparation for the NestJS app. Runs BEFORE the OpenAPI
 * generation (which needs the Prisma client) and before the verification gates.
 */
function prepareGatesFor(kind, hasDb, capabilities = [], appDir = 'apps/api') {
  // Flutter resolves its own dependencies through pub, outside the npm workspace.
  if (kind === 'flutter') return [['mobile: flutter pub get', 'flutter', ['pub', 'get'], appDir]];
  if (kind === 'fastapi') {
    return [
      ['api: create Python virtual environment', 'python', ['-m', 'venv', '.venv'], appDir],
      ['api: install locked Python dependencies', '.venv/bin/python', ['-m', 'pip', 'install', '--disable-pip-version-check', '-r', 'requirements.lock'], appDir],
      ['api: create production-only Python environment', 'python', ['-m', 'venv', '.runtime-venv'], appDir],
      ['api: install production-only Python lock', '.runtime-venv/bin/python', ['-m', 'pip', 'install', '--disable-pip-version-check', '-r', 'requirements.runtime.lock'], appDir],
    ];
  }
  if (kind !== 'nestjs') return [];
  return [
    ['api: prisma generate', 'npm', ['run', 'prisma:generate', `--workspace=${appDir}`]],
    ['api: prisma validate', 'npm', ['run', 'prisma:validate', `--workspace=${appDir}`]],
    ...(hasDb ? [['api: prisma migrate deploy', 'npm', ['run', 'prisma:migrate:deploy', `--workspace=${appDir}`]]] : []),
    // Seed structurel gouverné : composé via `nestjs.prisma-seed`, idempotent,
    // sans identité ni donnée métier.
    ...(hasDb && capabilities.includes('rbac')
      ? [['api: prisma seed (composed, idempotent)', 'npm', ['run', 'prisma:seed', `--workspace=${appDir}`]]]
      : []),
  ];
}

function gatesFor(kind, hasDb, capabilities = [], appDir = 'apps/api') {
  if (kind === 'nestjs') {
    return [
      ['api: lint', 'npm', ['run', 'lint', `--workspace=${appDir}`]],
      ['api: unit tests', 'npm', ['run', 'test', `--workspace=${appDir}`]],
      ...(hasDb ? [['api: e2e (Auth)', 'npm', ['run', 'test:e2e', `--workspace=${appDir}`]]] : []),
      ['api: build', 'npm', ['run', 'build', `--workspace=${appDir}`]],
    ];
  }
  if (kind === 'nextjs') {
    return [
      ['web: typecheck', 'npm', ['run', 'typecheck', `--workspace=${appDir}`]],
      ['web: lint', 'npm', ['run', 'lint', `--workspace=${appDir}`]],
      ['web: tests', 'npm', ['run', 'test', `--workspace=${appDir}`]],
      ['web: build', 'npm', ['run', 'build', `--workspace=${appDir}`]],
    ];
  }
  if (kind === 'react-native') {
    return [
      ['mobile: typecheck', 'npm', ['run', 'typecheck', `--workspace=${appDir}`]],
      ['mobile: lint', 'npm', ['run', 'lint', `--workspace=${appDir}`]],
      ['mobile: tests', 'npm', ['run', 'test', `--workspace=${appDir}`]],
      ['mobile: expo doctor', 'npm', ['run', 'doctor', `--workspace=${appDir}`]],
      ['mobile: expo export (ios, no simulator)', 'npx', ['expo', 'export', '-p', 'ios'], appDir],
    ];
  }
  if (kind === 'spring') {
    // `verify` covers compile, unit tests and Testcontainers integration tests.
    // Docker must be reachable; the driver refuses to claim a pass without it.
    return [['api: mvnw verify', './mvnw', ['verify', '--no-transfer-progress', '-B'], appDir]];
  }
  if (kind === 'fastapi') {
    return [
      ['api: ruff', '.venv/bin/python', ['-m', 'ruff', 'check', '.'], appDir],
      ['api: tests', '.venv/bin/python', ['-m', 'pytest', '-q'], appDir],
      ['api: compile', '.venv/bin/python', ['-m', 'compileall', '-q', 'app'], appDir],
      ['api: dependency consistency', '.venv/bin/python', ['-m', 'pip', 'check'], appDir],
      ['api: dependency audit', '.venv/bin/python', ['-m', 'pip_audit', '--strict', '--progress-spinner', 'off'], appDir],
      ['api: production dependency smoke', '.runtime-venv/bin/python', ['-c', 'import fastapi, pydantic_settings, uvicorn; print("production dependencies: ok")'], appDir],
      ['api: production dependency consistency', '.runtime-venv/bin/python', ['-m', 'pip', 'check'], appDir],
    ];
  }
  if (kind === 'angular') {
    // Angular publishes no `typecheck` script: `build` is the compilation gate.
    return [
      ['web: tests (Karma, ChromeHeadless)', 'npm', ['run', 'test:ci', `--workspace=${appDir}`]],
      ['web: build', 'npm', ['run', 'build', `--workspace=${appDir}`]],
    ];
  }
  if (kind === 'flutter') {
    return [
      ['mobile: flutter analyze', 'flutter', ['analyze'], appDir],
      ['mobile: flutter test', 'flutter', ['test'], appDir],
      ['mobile: dart format', 'dart', ['format', '--output=none', '--set-exit-if-changed', '.'], appDir],
      ['mobile: flutter build apk (debug, no emulator)', 'flutter', ['build', 'apk', '--debug'], appDir],
    ];
  }
  return [];
}

/**
 * Startup proof: the generated application is actually launched and its health
 * endpoint polled. Returns `null` when a target has no verifiable headless
 * startup — a mobile app needs an emulator, so its absence is declared, never
 * silently counted as a pass.
 */
export function startupProbeFor(kind, appDir) {
  if (kind === 'spring') {
    return {
      slot: 'api', runtime: 'spring', cwd: appDir ?? 'apps/api', cmd: './mvnw',
      args: ['spring-boot:run', '-q'], url: 'http://127.0.0.1:8080/health', needsDb: true,
    };
  }
  if (kind === 'nestjs') {
    return {
      slot: 'api', runtime: 'nestjs', cwd: appDir ?? 'apps/api', cmd: 'npm',
      args: ['run', 'start:prod'], url: 'http://127.0.0.1:3000/health', needsDb: true,
    };
  }
  if (kind === 'fastapi') {
    return {
      slot: 'api', runtime: 'fastapi', cwd: appDir ?? 'apps/api', cmd: '.venv/bin/python',
      args: ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'],
      url: 'http://127.0.0.1:8000/health', needsDb: false,
    };
  }
  if (kind === 'nextjs') {
    return { slot: 'web', runtime: 'nextjs', cwd: appDir ?? 'apps/web', cmd: 'npm', args: ['run', 'start'], url: 'http://127.0.0.1:3100/', needsDb: false };
  }
  if (kind === 'angular') {
    return {
      slot: 'web',
      runtime: 'angular',
      cwd: appDir ?? 'apps/web',
      cmd: 'npm',
      args: ['start', '--', '--host', '127.0.0.1', '--port', '4200'],
      url: 'http://127.0.0.1:4200/',
      needsDb: false,
    };
  }
  // react-native / flutter: no headless startup without an emulator.
  return null;
}

function healthPayload(body) {
  return body?.data ?? body;
}

/**
 * Proves the cross-runtime API health contract on a live process: status
 * semantics, correlation, W3C propagation and security headers. `fetchImpl` is
 * injectable so the contract logic is unit-tested without a socket.
 */
export async function verifyHttpContract(probe, fetchImpl = fetch) {
  if (!['nestjs', 'spring', 'fastapi'].includes(probe.runtime)) return [];
  const traceId = '4bf92f3577b34da6a3ce929d0e0e4736';
  const parentSpanId = '00f067aa0ba902b7';
  const requestId = 'runtime-proof-1234';
  const expected = [
    ['', 'ok'],
    ['/live', 'live'],
    ['/ready', 'ready'],
  ];
  const evidence = [];
  for (const [suffix, expectedStatus] of expected) {
    const response = await fetchImpl(`${probe.url}${suffix}`, {
      headers: {
        'X-Request-Id': requestId,
        traceparent: `00-${traceId}-${parentSpanId}-01`,
      },
      signal: AbortSignal.timeout(5000),
    });
    if (response.status !== 200) {
      throw new Error(`${probe.runtime} ${suffix || '/'} returned HTTP ${response.status}`);
    }
    const payload = healthPayload(await response.json());
    if (payload?.status !== expectedStatus) {
      throw new Error(`${probe.runtime} ${suffix || '/'} returned status '${payload?.status}'`);
    }
    if (response.headers.get('x-request-id') !== requestId) {
      throw new Error(`${probe.runtime} ${suffix || '/'} did not propagate X-Request-Id`);
    }
    const continuedTrace = response.headers.get('traceparent') ?? '';
    const traceMatch = continuedTrace.match(
      new RegExp(`^00-${traceId}-([0-9a-f]{16})-01$`),
    );
    if (!traceMatch
      || traceMatch[1] === parentSpanId
      || traceMatch[1] === '0000000000000000') {
      throw new Error(`${probe.runtime} ${suffix || '/'} did not continue the W3C trace`);
    }
    if (response.headers.get('x-content-type-options') !== 'nosniff') {
      throw new Error(`${probe.runtime} ${suffix || '/'} missed the security header contract`);
    }
    evidence.push({ path: `/health${suffix}`, status: response.status, state: payload.status });
  }
  return evidence;
}

/** Operations always published by the NestJS baseline (`base`). */
export const BASE_NESTJS_OPERATIONS = ['health_get', 'health_live', 'health_ready'];

/** Reads the operationIds of an OpenAPI document. */
function operationIds(document) {
  return Object.values(document.paths ?? {})
    .flatMap((methods) => Object.values(methods).map((operation) => operation.operationId))
    .filter(Boolean)
    .sort();
}

/**
 * Generates OpenAPI from the composed app, asserts the operation set expected for
 * the composed capabilities (declared by each overlay in `contract.openapiOperations`)
 * and proves reproducibility by regenerating and comparing digests.
 */
async function verifyComposedOpenApi(out, blueprint, application, environment = process.env) {
  console.log('\n── OpenAPI generated from the composed application');
  const lock = JSON.parse(await readFile(join(out, 'enistere.lock'), 'utf8'));
  const expected = [...new Set([
    ...BASE_NESTJS_OPERATIONS,
    ...lock.overlays.filter((o) => o.target === 'nestjs').flatMap((o) => o.openapiOperations ?? []),
  ])].sort();

  const snapshot = join(out, application.appDir, 'openapi/openapi.json');
  const generate = () => spawnSync('npm', ['run', 'openapi:generate', `--workspace=${application.appDir}`], {
    cwd: out, stdio: 'inherit', shell: false, env: environment,
  });
  if (generate().status !== 0) { console.log('\n❌ FAILED: openapi:generate'); return false; }

  const first = await readFile(snapshot, 'utf8');
  const document = JSON.parse(first);
  const actual = operationIds(document);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    console.log(`\n❌ FAILED: OpenAPI operations mismatch\n   expected: ${expected.join(', ')}\n   actual:   ${actual.join(', ')}`);
    return false;
  }

  // Reproducibility: regenerating must yield a byte-identical document.
  if (generate().status !== 0) { console.log('\n❌ FAILED: openapi:generate (second run)'); return false; }
  const second = await readFile(snapshot, 'utf8');
  if (first !== second) { console.log('\n❌ FAILED: generated OpenAPI is not reproducible'); return false; }

  const digest = createHash('sha256').update(second).digest('hex');
  console.log(`✓ OpenAPI operations: ${actual.join(', ')}`);
  console.log(`✓ OpenAPI reproducible, digest ${digest.slice(0, 12)}…`);
  return true;
}

/** Polls `url` until it answers or the deadline passes. */
async function waitForHttp(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (response.status < 500) return response.status;
    } catch { /* not up yet */ }
    await new Promise((done) => setTimeout(done, 1000));
  }
  return null;
}

/**
 * Launches a generated application and proves it answers on its health endpoint.
 * The process is always terminated, including on failure.
 */
async function verifyStartup(out, probe, environment = process.env, timeoutMs = 180000) {
  const { spawn } = await import('node:child_process');
  console.log(`\n── startup: ${probe.slot} (${probe.cmd} ${probe.args.join(' ')}) → ${probe.url}`);
  const child = spawn(probe.cmd, probe.args, {
    cwd: join(out, probe.cwd), env: environment, shell: false, stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  try {
    const status = await waitForHttp(probe.url, timeoutMs);
    if (status === null) {
      console.log(`\n❌ FAILED: ${probe.slot} did not answer on ${probe.url} within ${timeoutMs / 1000}s`);
      console.log(output.split('\n').slice(-25).join('\n'));
      return false;
    }
    console.log(`✓ ${probe.slot} started and answered ${status} on ${probe.url}`);
    const evidence = await verifyHttpContract(probe);
    for (const proof of evidence) {
      console.log(`✓ HTTP contract ${probe.runtime} ${proof.path}: ${proof.status}/${proof.state}`);
    }
    if (probe.runtime === 'angular') {
      const e2e = spawnSync('npm', ['run', 'test:e2e'], {
        cwd: join(out, probe.cwd),
        stdio: 'inherit',
        shell: false,
        env: { ...environment, E2E_WEB_URL: probe.url },
      });
      if (e2e.status !== 0) {
        console.log('\n❌ FAILED: Angular runtime E2E contract');
        return false;
      }
      console.log('✓ Angular runtime E2E contract');
    }
    return true;
  } finally {
    try { process.kill(-child.pid, 'SIGTERM'); } catch { /* already gone */ }
    await new Promise((done) => setTimeout(done, 1500));
    try { process.kill(-child.pid, 'SIGKILL'); } catch { /* already gone */ }
  }
}

/** Proves that the distributed graph and ownership contracts were materialized. */
export async function verifyDistributedContracts(out, plan) {
  if (plan.architectureProfile.id !== 'distributed-platform') return [];
  const communications = JSON.parse(await readFile(join(out, 'packages/contracts/communications.json'), 'utf8'));
  const ownership = JSON.parse(await readFile(join(out, 'packages/contracts/ownership.json'), 'utf8'));
  const deployment = JSON.parse(await readFile(join(out, 'infrastructure/deployment-plan.json'), 'utf8'));
  const applicationIds = new Set(plan.applications.map((application) => application.id));
  if (plan.architectureProfile.generatable !== true || plan.support.level !== 'ready') {
    throw new Error('distributed plan is not marked generatable and ready');
  }
  if (ownership.authorities.length !== 2) throw new Error('distributed golden requires two owned authorities');
  const domains = ownership.authorities.flatMap((authority) => authority.domains);
  if (new Set(domains).size !== domains.length) throw new Error('distributed data domains are not exclusive');
  if (communications.edges.length === 0) throw new Error('distributed communication graph is empty');
  for (const edge of communications.edges) {
    if (!applicationIds.has(edge.from) || !applicationIds.has(edge.to)) {
      throw new Error(`communication ${edge.id} references an unknown application`);
    }
    if (edge.mode !== 'synchronous' || edge.protocol !== 'http' || !edge.contract.endsWith('.v1')) {
      throw new Error(`communication ${edge.id} is outside the proven contract`);
    }
  }
  if (deployment.order.length !== 2
    || JSON.stringify(deployment.rollbackOrder) !== JSON.stringify([...deployment.order].reverse())) {
    throw new Error('distributed deployment and rollback order is not deterministic');
  }
  return [
    `authorities=${ownership.authorities.length}`,
    `ownedDomains=${domains.length}`,
    `communicationEdges=${communications.edges.length}`,
    `deploymentOrder=${deployment.order.join('>')}`,
    `dataNamespaces=${ownership.authorities.map((authority) => `authority_${authority.application.replaceAll('-', '_')}`).join(',')}`,
  ];
}

async function main() {
  const [composition, ...rest] = process.argv.slice(2);
  const keep = rest.includes('--keep');
  const spec = COMPOSITIONS[composition];
  if (!spec) {
    console.error(`Unknown composition "${composition}". Known: ${Object.keys(COMPOSITIONS).join(', ')}`);
    process.exit(1);
  }

  const root = await mkdtemp(join(tmpdir(), `enistere-golden-${composition}-`));
  const out = join(root, 'project');
  const blueprint = compositionBlueprint(composition);

  console.log(`Golden runtime: ${composition}\n  output: ${out}`);
  const plan = await generateProject(blueprint, out);

  // Live DB gates (migrate deploy, NestJS e2e) require a real, reachable
  // PostgreSQL — signalled explicitly by the CI. Schema-only gates always run.
  const hasDb = process.env.GOLDEN_RUNTIME_DB === '1';
  const applications = plan.applications;
  const kinds = [...new Set(applications.map((application) => application.runtime))];

  let ok = true;
  if (plan.architectureProfile.id === 'distributed-platform') {
    try {
      const evidence = await verifyDistributedContracts(out, plan);
      for (const proof of evidence) console.log(`✓ distributed contract ${proof}`);
    } catch (error) {
      console.log(`\n❌ FAILED: distributed contracts — ${error.message}`);
      ok = false;
    }
  }
  // 1) Dependency finalization through the engine used by `enistere install`:
  //    resolve the root lock WITHOUT lifecycle scripts, then install from it (npm ci).
  try {
    console.log('\n── dependency finalization (lock without lifecycle scripts, then npm ci)');
    const dependencies = await finalizeDependencies(out);
    console.log(`✓ dependenciesLocked=${dependencies.dependenciesLocked} lockDigest=${dependencies.lockDigest.slice(0, 12)}…`);
  } catch (error) {
    console.log(`\n❌ FAILED: dependency finalization — ${error.message}`);
    ok = false;
  }
  // 2) The generated project must verify its own recorded lock digest.
  if (ok) {
    const verified = await verifyProjectDependencies(out);
    if (!verified.valid || !verified.dependenciesLocked) {
      console.log(`\n❌ FAILED: enistere verify <project> — ${verified.issues.join('; ')}`);
      ok = false;
    } else {
      console.log('✓ enistere verify <project>: lock digest matches enistere.lock');
    }
  }
  // 3) Shared packages build.
  if (ok) ok = run('build:packages', 'npm', ['run', 'build:packages'], out) && ok;
  // 4) Schema/database preparation (Prisma client needed by the OpenAPI generation).
  if (ok) {
    for (const application of applications) {
      const environment = runtimeEnvironmentFor(
        application,
        plan.architectureProfile.id,
      );
      for (const [label, cmd, args, cwd] of prepareGatesFor(
        application.runtime,
        hasDb,
        blueprint.capabilities,
        application.appDir,
      )) {
        ok = run(label, cmd, args, cwd ? join(out, cwd) : out, environment) && ok;
        if (!ok) break;
      }
      if (!ok) break;
    }
  }
  // 5) OpenAPI is GENERATED from the composed application before the verification
  //     gates, so the e2e freshness invariant checks THIS composition's contract
  //     (never a copied snapshot). Also asserts the declared operation set and
  //     proves the generated contract is reproducible.
  if (ok) {
    for (const application of applications.filter((item) => item.runtime === 'nestjs')) {
      const environment = runtimeEnvironmentFor(
        application,
        plan.architectureProfile.id,
      );
      ok = await verifyComposedOpenApi(out, blueprint, application, environment) && ok;
      if (!ok) break;
    }
  }
  // 6) Per-application verification gates.
  if (ok) {
    for (const application of applications) {
      const environment = runtimeEnvironmentFor(
        application,
        plan.architectureProfile.id,
      );
      for (const [label, cmd, args, cwd] of gatesFor(
        application.runtime,
        hasDb,
        blueprint.capabilities,
        application.appDir,
      )) {
        ok = run(label, cmd, args, cwd ? join(out, cwd) : out, environment) && ok;
        if (!ok) break;
      }
      if (!ok) break;
    }
  }
  // 6a) Capability product conformance (ADR-068, ADR-069): every neutral product
  //     contract of the composed capabilities is re-checked against the
  //     MATERIALIZED application, so the evidence declared in the Foundation must
  //     still exist in the composed project. Runs only after the real gates above
  //     passed — a green report on a failing app would prove nothing.
  if (ok && blueprint.capabilities.length > 0) {
    console.log('\n── capability conformance (materialized)');
    try {
      const reports = await verifyMaterializedCapabilities(out, plan, REPO_ROOT);
      for (const report of reports) {
        for (const [target, result] of Object.entries(report.targets)) {
          if (result.materialized) {
            console.log(
              `   ${report.capability.padEnd(6)} ${target.padEnd(13)} ${result.status}`
              + ` (${result.invariants.length} invariants)`,
            );
          }
        }
      }
    } catch (error) {
      console.error(`   ${error.message}`);
      ok = false;
    }
  }
  // 6b) Startup proof (R8): the generated application is actually launched and
  //     answers on its health endpoint. Opt-in, because it needs a reachable
  //     database for the API and real ports. Targets without a headless startup
  //     (mobile) are declared as such — never counted as a silent pass.
  if (ok && process.env.GOLDEN_RUNTIME_START === '1') {
    for (const application of applications) {
      const probe = startupProbeFor(application.runtime, application.appDir);
      if (!probe) {
        console.log(`\n── startup: ${application.runtime} has no headless startup proof (emulator required) — not claimed`);
        continue;
      }
      if (probe.needsDb && !hasDb) {
        console.log(`\n── startup: ${application.runtime} needs a database (GOLDEN_RUNTIME_DB=1) — not claimed`);
        continue;
      }
      const environment = runtimeEnvironmentFor(
        application,
        plan.architectureProfile.id,
      );
      ok = await verifyStartup(out, probe, environment) && ok;
      if (!ok) break;
    }
  }
  // 7) npm audit by documented exception (no global disabling).
  if (ok) {
    const [cmd, args] = auditGate(out, kinds);
    ok = run('npm audit (documented exceptions only)', cmd, args, REPO_ROOT) && ok;
  }
  // 8) Lock determinism: the same blueprint on the same Foundation must resolve to
  //    the same lock digest. Re-generates a twin and re-resolves the lock only.
  if (ok) {
    console.log('\n── lock determinism (same blueprint + same Foundation → same digest)');
    const twin = join(root, 'twin');
    await generateProject(compositionBlueprint(composition), twin);
    try {
      const twinDeps = await finalizeDependencies(twin, { install: false });
      const firstManifest = JSON.parse(await readFile(join(out, 'enistere.lock'), 'utf8'));
      const twinManifest = JSON.parse(await readFile(join(twin, 'enistere.lock'), 'utf8'));
      const first = firstManifest.lockDigest;
      if (twinDeps.lockDigest !== first) {
        console.log(`\n❌ FAILED: lock digest differs (${first?.slice(0, 12)}… vs ${twinDeps.lockDigest?.slice(0, 12)}…)`);
        ok = false;
      } else if (JSON.stringify(firstManifest.runtimeLocks ?? []) !== JSON.stringify(twinManifest.runtimeLocks ?? [])) {
        console.log('\n❌ FAILED: runtime dependency lock digests differ');
        ok = false;
      } else {
        console.log(`✓ lock digest reproducible: ${first.slice(0, 12)}…`);
        if ((firstManifest.runtimeLocks ?? []).length > 0) {
          console.log(`✓ runtime lock digests reproducible: ${firstManifest.runtimeLocks.length}`);
        }
      }
    } catch (error) {
      console.log(`\n❌ FAILED: lock determinism — ${error.message}`);
      ok = false;
    }
  }

  if (!keep) await rm(root, { recursive: true, force: true });
  else console.log(`\n(kept: ${out})`);

  console.log(`\n${ok ? '✅' : '❌'} Golden runtime ${composition}: ${ok ? 'PASS' : 'FAIL'}`);
  process.exit(ok ? 0 : 1);
}

// Only run when invoked as a program (the exports above are unit-tested).
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => { console.error(error); process.exit(1); });
}
