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
 *
 * Gates DB (prisma migrate, e2e NestJS) exécutés uniquement si DATABASE_URL est
 * défini. Aucun secret réel : la CI fournit des valeurs jetables via l'env.
 */
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateProject } from '../../engine/generator.mjs';
import { createDefaultBlueprint } from '../../engine/blueprint.mjs';
import { finalizeDependencies, verifyProjectDependencies } from '../../engine/dependencies.mjs';
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
};
for (const [key, value] of Object.entries(TEST_ENV_DEFAULTS)) {
  if (!process.env[key]) process.env[key] = value;
}

export const COMPOSITIONS = {
  'nestjs-base': { stack: { api: 'nestjs', web: null, mobile: null }, capabilities: ['base'] },
  'nestjs-auth': { stack: { api: 'nestjs', web: null, mobile: null }, capabilities: ['base', 'auth'] },
  'nest-next-auth': { stack: { api: 'nestjs', web: 'nextjs', mobile: null }, capabilities: ['base', 'auth'] },
  'triple-auth': { stack: { api: 'nestjs', web: 'nextjs', mobile: 'react-native' }, capabilities: ['base', 'auth'] },
  // RBAC (1B) : NestJS + Next.js consomment RBAC ; React Native reste sur base + auth
  // (`not-applicable`) sans recevoir la moindre surface RBAC.
  'nestjs-auth-rbac': { stack: { api: 'nestjs', web: null, mobile: null }, capabilities: ['base', 'auth', 'rbac'] },
  'nest-next-auth-rbac': { stack: { api: 'nestjs', web: 'nextjs', mobile: null }, capabilities: ['base', 'auth', 'rbac'] },
  'triple-auth-rbac': { stack: { api: 'nestjs', web: 'nextjs', mobile: 'react-native' }, capabilities: ['base', 'auth', 'rbac'] },
};

/** argv of the npm-audit-by-exception gate applied to every golden. */
export function auditGate(projectDir, kinds) {
  return ['node', [AUDIT_CHECK, projectDir, '--targets', kinds.join(',')]];
}

/** Blueprint for a composition (shared by the driver and its tests). */
export function compositionBlueprint(composition, slug = `golden-${composition}`) {
  const spec = COMPOSITIONS[composition];
  if (!spec) throw new Error(`Unknown composition: ${composition}`);
  const blueprint = createDefaultBlueprint(slug);
  blueprint.stack = spec.stack;
  blueprint.capabilities = spec.capabilities;
  blueprint.designSystem = true;
  blueprint.deployment = { environments: ['local'] };
  return blueprint;
}

function run(label, cmd, args, cwd) {
  process.stdout.write(`\n── ${label}\n   $ ${cmd} ${args.join(' ')}  (cwd: ${cwd})\n`);
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: false, env: process.env });
  if (result.status !== 0) {
    process.stdout.write(`\n❌ FAILED: ${label} (exit ${result.status ?? 'signal ' + result.signal})\n`);
    return false;
  }
  process.stdout.write(`✓ ${label}\n`);
  return true;
}

/**
 * Database/schema preparation for the NestJS app. Runs BEFORE the OpenAPI
 * generation (which needs the Prisma client) and before the verification gates.
 */
function prepareGatesFor(kind, hasDb, capabilities = []) {
  if (kind !== 'nestjs') return [];
  return [
    ['api: prisma generate', 'npm', ['run', 'prisma:generate', '--workspace=apps/api']],
    ['api: prisma validate', 'npm', ['run', 'prisma:validate', '--workspace=apps/api']],
    ...(hasDb ? [['api: prisma migrate deploy', 'npm', ['run', 'prisma:migrate:deploy', '--workspace=apps/api']]] : []),
    // Seed structurel gouverné : composé via `nestjs.prisma-seed`, idempotent,
    // sans identité ni donnée métier.
    ...(hasDb && capabilities.includes('rbac')
      ? [['api: prisma seed (composed, idempotent)', 'npm', ['run', 'prisma:seed', '--workspace=apps/api']]]
      : []),
  ];
}

function gatesFor(kind, hasDb, capabilities = []) {
  if (kind === 'nestjs') {
    return [
      ['api: lint', 'npm', ['run', 'lint', '--workspace=apps/api']],
      ['api: unit tests', 'npm', ['run', 'test', '--workspace=apps/api']],
      ...(hasDb ? [['api: e2e (Auth)', 'npm', ['run', 'test:e2e', '--workspace=apps/api']]] : []),
      ['api: build', 'npm', ['run', 'build', '--workspace=apps/api']],
    ];
  }
  if (kind === 'nextjs') {
    return [
      ['web: typecheck', 'npm', ['run', 'typecheck', '--workspace=apps/web']],
      ['web: lint', 'npm', ['run', 'lint', '--workspace=apps/web']],
      ['web: tests', 'npm', ['run', 'test', '--workspace=apps/web']],
      ['web: build', 'npm', ['run', 'build', '--workspace=apps/web']],
    ];
  }
  if (kind === 'react-native') {
    return [
      ['mobile: typecheck', 'npm', ['run', 'typecheck', '--workspace=apps/mobile']],
      ['mobile: lint', 'npm', ['run', 'lint', '--workspace=apps/mobile']],
      ['mobile: tests', 'npm', ['run', 'test', '--workspace=apps/mobile']],
      ['mobile: expo doctor', 'npm', ['run', 'doctor', '--workspace=apps/mobile']],
      ['mobile: expo export (ios, no simulator)', 'npx', ['expo', 'export', '-p', 'ios'], 'apps/mobile'],
    ];
  }
  return [];
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
async function verifyComposedOpenApi(out, blueprint) {
  console.log('\n── OpenAPI generated from the composed application');
  const lock = JSON.parse(await readFile(join(out, 'enistere.lock'), 'utf8'));
  const expected = [...new Set([
    ...BASE_NESTJS_OPERATIONS,
    ...lock.overlays.filter((o) => o.target === 'nestjs').flatMap((o) => o.openapiOperations ?? []),
  ])].sort();

  const snapshot = join(out, 'apps/api/openapi/openapi.json');
  const generate = () => spawnSync('npm', ['run', 'openapi:generate', '--workspace=apps/api'], {
    cwd: out, stdio: 'inherit', shell: false, env: process.env,
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
  await generateProject(blueprint, out);

  // Live DB gates (migrate deploy, NestJS e2e) require a real, reachable
  // PostgreSQL — signalled explicitly by the CI. Schema-only gates always run.
  const hasDb = process.env.GOLDEN_RUNTIME_DB === '1';
  const kinds = Object.entries(blueprint.stack).filter(([, v]) => v).map(([, v]) => v);

  let ok = true;
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
    for (const kind of kinds) {
      for (const [label, cmd, args, cwd] of prepareGatesFor(kind, hasDb, blueprint.capabilities)) {
        ok = run(label, cmd, args, cwd ? join(out, cwd) : out) && ok;
        if (!ok) break;
      }
      if (!ok) break;
    }
  }
  // 5) OpenAPI is GENERATED from the composed application before the verification
  //     gates, so the e2e freshness invariant checks THIS composition's contract
  //     (never a copied snapshot). Also asserts the declared operation set and
  //     proves the generated contract is reproducible.
  if (ok && kinds.includes('nestjs')) {
    ok = await verifyComposedOpenApi(out, blueprint) && ok;
  }
  // 6) Per-application verification gates.
  if (ok) {
    for (const kind of kinds) {
      for (const [label, cmd, args, cwd] of gatesFor(kind, hasDb, blueprint.capabilities)) {
        ok = run(label, cmd, args, cwd ? join(out, cwd) : out) && ok;
        if (!ok) break;
      }
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
      const first = JSON.parse(await readFile(join(out, 'enistere.lock'), 'utf8')).lockDigest;
      if (twinDeps.lockDigest !== first) {
        console.log(`\n❌ FAILED: lock digest differs (${first?.slice(0, 12)}… vs ${twinDeps.lockDigest?.slice(0, 12)}…)`);
        ok = false;
      } else {
        console.log(`✓ lock digest reproducible: ${first.slice(0, 12)}…`);
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
