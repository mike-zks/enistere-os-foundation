import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDefaultBlueprint } from '../engine/blueprint.mjs';
import { generateProject } from '../engine/generator.mjs';

/**
 * Reproducibility / lockfile strategy (strategy/06_DEPENDENCY_STRATEGY.md).
 *
 * The generated project is a single unified npm workspace: `@enistere/*` packages
 * are workspace members resolved through the `*` range (never `file:`/`link:`/a
 * Foundation path), so one root `package-lock.json` (produced by the first
 * `npm install`) locks the whole tree and `npm ci` reinstalls it reproducibly.
 * Actual `npm ci` execution is proven by the golden-runtime CI; here we assert the
 * deterministic, npm-ci-able shape the generator must always produce.
 */

async function exists(p) { try { await access(p, constants.F_OK); return true; } catch { return false; } }

function tripleAuth(slug) {
  const b = createDefaultBlueprint(slug);
  b.stack = { api: 'nestjs', web: 'nextjs', mobile: 'react-native' };
  b.capabilities = ['base', 'auth'];
  b.designSystem = true;
  b.deployment = { environments: ['local'] };
  return b;
}

async function allPackageJsons(root) {
  const out = {};
  for (const rel of ['package.json', 'apps/api/package.json', 'apps/web/package.json', 'apps/mobile/package.json',
    'packages/api-contracts/package.json', 'packages/api-client-fetch/package.json', 'packages/ui-kit/package.json']) {
    if (await exists(join(root, rel))) out[rel] = await readFile(join(root, rel), 'utf8');
  }
  return out;
}

describe('reproducibility and lockfile strategy', () => {
  it('is deterministic: identical blueprints produce identical manifests and lock', async () => {
    const rootA = await mkdtemp(join(tmpdir(), 'enistere-rep-a-'));
    const rootB = await mkdtemp(join(tmpdir(), 'enistere-rep-b-'));
    await generateProject(tripleAuth('rep-app'), join(rootA, 'p'));
    await generateProject(tripleAuth('rep-app'), join(rootB, 'p'));

    const lockA = JSON.parse(await readFile(join(rootA, 'p/enistere.lock'), 'utf8'));
    const lockB = JSON.parse(await readFile(join(rootB, 'p/enistere.lock'), 'utf8'));
    assert.deepEqual(lockA, lockB, 'enistere.lock must be deterministic');
    assert.equal(lockA.blueprintDigest, lockB.blueprintDigest);
    for (const o of lockA.overlays) assert.match(o.digest, /^[0-9a-f]{64}$/);

    const pkgsA = await allPackageJsons(join(rootA, 'p'));
    const pkgsB = await allPackageJsons(join(rootB, 'p'));
    assert.deepEqual(Object.keys(pkgsA).sort(), Object.keys(pkgsB).sort());
    for (const key of Object.keys(pkgsA)) assert.equal(pkgsA[key], pkgsB[key], `${key} must be byte-identical`);
  });

  it('produces a single unified workspace with all npm apps as members', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enistere-rep-ws-'));
    const out = join(root, 'p');
    await generateProject(tripleAuth('ws-app'), out);
    const rootPkg = JSON.parse(await readFile(join(out, 'package.json'), 'utf8'));
    assert.deepEqual(rootPkg.workspaces, ['packages/*', 'apps/api', 'apps/web', 'apps/mobile']);
  });

  it('leaves no per-app lockfile (the root lock is authoritative)', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enistere-rep-lock-'));
    const out = join(root, 'p');
    await generateProject(tripleAuth('lock-app'), out);
    for (const app of ['api', 'web', 'mobile']) {
      assert.equal(await exists(join(out, `apps/${app}/package-lock.json`)), false, `apps/${app} must not keep a lockfile`);
    }
  });

  it('resolves @enistere packages through the workspace (no file:/link:/Foundation path)', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enistere-rep-res-'));
    const out = join(root, 'p');
    await generateProject(tripleAuth('res-app'), out);
    for (const rel of ['package.json', 'apps/api/package.json', 'apps/web/package.json', 'apps/mobile/package.json']) {
      const pkg = JSON.parse(await readFile(join(out, rel), 'utf8'));
      for (const section of ['dependencies', 'devDependencies']) {
        for (const [name, spec] of Object.entries(pkg[section] ?? {})) {
          assert.ok(!/^(file:|link:|portal:)/.test(spec), `${rel}: ${name} must not use a local path (${spec})`);
          if (name.startsWith('@enistere/')) {
            assert.equal(spec, '*', `${rel}: ${name} must resolve via the workspace (got ${spec})`);
          }
        }
      }
    }
    // The web and mobile apps really consume @enistere workspace packages.
    const web = JSON.parse(await readFile(join(out, 'apps/web/package.json'), 'utf8'));
    assert.ok(web.dependencies['@enistere/api-client-fetch'] === '*');
    const mobile = JSON.parse(await readFile(join(out, 'apps/mobile/package.json'), 'utf8'));
    assert.ok(mobile.dependencies['@enistere/api-client-fetch'] === '*', 'auth overlay wires @enistere on mobile');
  });

  it('materializes the shared @enistere workspace packages', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enistere-rep-pkgs-'));
    const out = join(root, 'p');
    await generateProject(tripleAuth('pkgs-app'), out);
    for (const pkg of ['api-contracts', 'api-client-fetch', 'ui-kit']) {
      assert.ok(await exists(join(out, `packages/${pkg}/package.json`)), `packages/${pkg} must be present`);
    }
    // api-contracts ships its own frozen canonical contract (self-contained generation).
    assert.ok(await exists(join(out, 'packages/api-contracts/contract/openapi.json')));
  });
});
