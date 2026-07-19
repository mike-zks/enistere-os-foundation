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
 *
 * Gates DB (prisma migrate, e2e NestJS) exécutés uniquement si DATABASE_URL est
 * défini. Aucun secret réel : la CI fournit des valeurs jetables via l'env.
 */
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateProject } from '../../engine/generator.mjs';
import { createDefaultBlueprint } from '../../engine/blueprint.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

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

const COMPOSITIONS = {
  'nestjs-base': { stack: { api: 'nestjs', web: null, mobile: null }, capabilities: ['base'] },
  'nestjs-auth': { stack: { api: 'nestjs', web: null, mobile: null }, capabilities: ['base', 'auth'] },
  'nest-next-auth': { stack: { api: 'nestjs', web: 'nextjs', mobile: null }, capabilities: ['base', 'auth'] },
  'triple-auth': { stack: { api: 'nestjs', web: 'nextjs', mobile: 'react-native' }, capabilities: ['base', 'auth'] },
};

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

function gatesFor(kind, hasDb) {
  if (kind === 'nestjs') {
    return [
      ['api: prisma generate', 'npm', ['run', 'prisma:generate', '--workspace=apps/api']],
      ['api: prisma validate', 'npm', ['run', 'prisma:validate', '--workspace=apps/api']],
      ...(hasDb ? [['api: prisma migrate deploy', 'npm', ['run', 'prisma:migrate:deploy', '--workspace=apps/api']]] : []),
      ['api: lint', 'npm', ['run', 'lint', '--workspace=apps/api']],
      ['api: unit tests', 'npm', ['run', 'test', '--workspace=apps/api']],
      ...(hasDb ? [['api: e2e (Auth)', 'npm', ['run', 'test:e2e', '--workspace=apps/api']]] : []),
      ['api: openapi:check', 'npm', ['run', 'openapi:check', '--workspace=apps/api']],
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
  const blueprint = createDefaultBlueprint(`golden-${composition}`);
  blueprint.stack = spec.stack;
  blueprint.capabilities = spec.capabilities;
  blueprint.designSystem = true;
  blueprint.deployment = { environments: ['local'] };

  console.log(`Golden runtime: ${composition}\n  output: ${out}`);
  await generateProject(blueprint, out);

  // Live DB gates (migrate deploy, NestJS e2e) require a real, reachable
  // PostgreSQL — signalled explicitly by the CI. Schema-only gates always run.
  const hasDb = process.env.GOLDEN_RUNTIME_DB === '1';
  const kinds = Object.entries(blueprint.stack).filter(([, v]) => v).map(([, v]) => v);

  let ok = true;
  // 1) Reproducible install: npm install (writes root lock) then npm ci (reinstall from lock).
  ok = run('npm install (writes root lock)', 'npm', ['install', '--no-audit', '--no-fund'], out) && ok;
  if (ok) ok = run('npm ci (reproducible reinstall)', 'npm', ['ci', '--no-audit', '--no-fund'], out) && ok;
  // 2) Shared packages build.
  if (ok) ok = run('build:packages', 'npm', ['run', 'build:packages'], out) && ok;
  // 3) Per-application gates.
  if (ok) {
    for (const kind of kinds) {
      for (const [label, cmd, args, cwd] of gatesFor(kind, hasDb)) {
        ok = run(label, cmd, args, cwd ? join(out, cwd) : out) && ok;
        if (!ok) break;
      }
      if (!ok) break;
    }
  }

  if (!keep) await rm(root, { recursive: true, force: true });
  else console.log(`\n(kept: ${out})`);

  console.log(`\n${ok ? '✅' : '❌'} Golden runtime ${composition}: ${ok ? 'PASS' : 'FAIL'}`);
  process.exit(ok ? 0 : 1);
}

main().catch((error) => { console.error(error); process.exit(1); });
