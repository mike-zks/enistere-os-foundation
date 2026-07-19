import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { constants } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createDefaultBlueprint } from '../engine/blueprint.mjs';
import { generateProject } from '../engine/generator.mjs';
import { finalizeDependencies, verifyProjectDependencies } from '../engine/dependencies.mjs';

/**
 * Network-bound half of the dependency contract: really resolving a lock and
 * really running `npm ci` in a generated project. Requires the npm registry, so
 * it is opt-in via ENISTERE_NETWORK_TESTS=1 and executed by the
 * Factory Golden Runtime CI (which has network) — never silently skipped there.
 */
const ENABLED = process.env.ENISTERE_NETWORK_TESTS === '1';
const REPO_ROOT = resolve(import.meta.dirname, '../..');

async function exists(p) { try { await access(p, constants.F_OK); return true; } catch { return false; } }

function nestjsBase(slug = 'install-app') {
  const b = createDefaultBlueprint(slug);
  b.stack = { api: 'nestjs', web: null, mobile: null };
  b.capabilities = ['base'];
  b.designSystem = true;
  b.deployment = { environments: ['local'] };
  return b;
}

describe('dependency finalization (network)', { skip: ENABLED ? false : 'set ENISTERE_NETWORK_TESTS=1' }, () => {
  it('generate --install produces a root lockfile and an npm-ci-able project', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enistere-net-'));
    const out = join(root, 'p');
    const blueprintPath = join(root, 'blueprint.json');
    await rm(blueprintPath, { force: true });
    const { writeFile } = await import('node:fs/promises');
    await writeFile(blueprintPath, `${JSON.stringify(nestjsBase(), null, 2)}\n`);

    // Drive the real CLI surface, not just the engine.
    const cli = spawnSync('node', [join(REPO_ROOT, 'factory/cli/enistere.mjs'), 'generate', blueprintPath, out, '--install'], {
      encoding: 'utf8', shell: false, cwd: REPO_ROOT,
    });
    assert.equal(cli.status, 0, `CLI failed: ${cli.stderr}`);

    assert.ok(await exists(join(out, 'package-lock.json')), 'root package-lock.json must exist');
    const manifest = JSON.parse(await readFile(join(out, 'enistere.lock'), 'utf8'));
    assert.equal(manifest.dependenciesLocked, true);
    assert.match(manifest.lockDigest, /^[0-9a-f]{64}$/);

    // npm ci must work immediately after the command, from a clean tree.
    await rm(join(out, 'node_modules'), { recursive: true, force: true });
    const ci = spawnSync('npm', ['ci', '--no-audit', '--no-fund'], { cwd: out, encoding: 'utf8', shell: false });
    assert.equal(ci.status, 0, `npm ci failed: ${ci.stderr}`);

    const verified = await verifyProjectDependencies(out);
    assert.equal(verified.valid, true);
    assert.equal(verified.dependenciesLocked, true);

    await rm(root, { recursive: true, force: true });
  });

  it('same blueprint + same Foundation resolve to the same lock and digest', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enistere-net-det-'));
    const a = join(root, 'a');
    const b = join(root, 'b');
    await generateProject(nestjsBase('det-app'), a);
    await generateProject(nestjsBase('det-app'), b);

    // Lock resolution only (no install): the digest must be identical.
    const first = await finalizeDependencies(a, { install: false });
    const second = await finalizeDependencies(b, { install: false });
    assert.equal(first.lockDigest, second.lockDigest, 'lock digest must be reproducible');
    assert.equal(
      await readFile(join(a, 'package-lock.json'), 'utf8'),
      await readFile(join(b, 'package-lock.json'), 'utf8'),
      'lockfiles must be byte-identical',
    );

    await rm(root, { recursive: true, force: true });
  });
});
