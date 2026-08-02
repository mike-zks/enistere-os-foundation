import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, readdir, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDefaultBlueprint } from '../engine/blueprint.mjs';
import { generateProject } from '../engine/generator.mjs';

async function exists(path) {
  try { await access(path, constants.F_OK); return true; } catch { return false; }
}

async function outputInventory(root) {
  const files = [];
  let bytes = 0;
  const walk = async (directory, prefix = '') => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path, relative);
      else {
        files.push(relative);
        bytes += (await stat(path)).size;
      }
    }
  };
  await walk(root);
  return { files: files.sort(), bytes };
}

function baseBlueprint(slug, stack) {
  const blueprint = createDefaultBlueprint(slug);
  blueprint.stack = stack;
  blueprint.capabilities = [];
  return blueprint;
}

describe('derived project materialization boundary', () => {
  it('delivers all seven runtimes without starter metadata, caches or machine paths', async () => {
    const selections = [
      ['nestjs', { api: 'nestjs', web: null, mobile: null }],
      ['spring', { api: 'spring', web: null, mobile: null }],
      ['fastapi', { api: 'fastapi', web: null, mobile: null }],
      ['nextjs', { api: 'nestjs', web: 'nextjs', mobile: null }],
      ['angular', { api: 'nestjs', web: 'angular', mobile: null }],
      ['react-native', { api: 'nestjs', web: null, mobile: 'react-native' }],
      ['flutter', { api: 'nestjs', web: null, mobile: 'flutter' }],
    ];
    const forbiddenSegments = new Set(['.angular', '.idea', '.ruff_cache']);
    const forbiddenFiles = new Set(['STARTER_SPECIFICATION.md', 'local.properties', 'starter.manifest.json']);

    for (const [runtime, stack] of selections) {
      const root = await mkdtemp(join(tmpdir(), `enistere-delivery-${runtime}-`));
      const output = join(root, 'project');
      await generateProject(baseBlueprint(`delivery-${runtime}`, stack), output);
      const { files } = await outputInventory(output);
      for (const path of files) {
        const segments = path.split('/');
        assert.ok(!segments.some((segment) => forbiddenSegments.has(segment)), `${runtime}: ${path}`);
        assert.ok(!forbiddenFiles.has(segments.at(-1)), `${runtime}: ${path}`);
      }
      assert.equal(await exists(join(output, 'capabilities')), false, runtime);
    }
  });

  it('applies only selected overlays without delivering their Foundation payload', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enistere-delivery-files-'));
    const output = join(root, 'project');
    const blueprint = baseBlueprint('customer-portal', {
      api: 'fastapi', web: 'angular', mobile: 'flutter',
    });
    blueprint.capabilities = ['files'];
    await generateProject(blueprint, output);

    assert.equal(await exists(join(output, 'capabilities')), false);
    assert.equal(await exists(join(output, 'apps/api/app/modules/files')), true);
    assert.equal(await exists(join(output, 'apps/web/src/app/features/files')), true);
    assert.equal(await exists(join(output, 'apps/mobile/lib/src/features/files')), true);

    const { files, bytes } = await outputInventory(output);
    const inventoryBytes = (await stat(join(output, 'enistere.inventory.json'))).size;
    // Measured after removing fabrication payload: 286 files / 718,339 bytes /
    // 32,799 inventory bytes. The budgets leave roughly 40% growth headroom.
    assert.ok(files.length < 400, `delivery grew to ${files.length} files`);
    assert.ok(bytes < 1_000_000, `delivery grew to ${bytes} bytes`);
    assert.ok(inventoryBytes < 50_000, `inventory grew to ${inventoryBytes} bytes`);
  });

  it('materializes the exact transitive closure of shared package consumers', async () => {
    const cases = [
      {
        slug: 'api-only',
        stack: { api: 'fastapi', web: null, mobile: null },
        capabilities: [],
        expected: [],
      },
      {
        slug: 'next-client',
        stack: { api: 'nestjs', web: 'nextjs', mobile: null },
        capabilities: [],
        expected: ['api-contracts', 'api-client-fetch', 'ui-kit'],
      },
      {
        slug: 'mobile-auth',
        stack: { api: 'nestjs', web: null, mobile: 'react-native' },
        capabilities: ['auth'],
        expected: ['api-contracts', 'api-client-fetch'],
      },
    ];

    for (const item of cases) {
      const root = await mkdtemp(join(tmpdir(), `enistere-packages-${item.slug}-`));
      const output = join(root, 'project');
      const blueprint = baseBlueprint(item.slug, item.stack);
      blueprint.capabilities = item.capabilities;
      await generateProject(blueprint, output);
      const directories = (await readdir(join(output, 'packages'), { withFileTypes: true }))
        .filter((entry) => entry.isDirectory() && entry.name !== 'contracts')
        .map((entry) => entry.name)
        .sort();
      assert.deepEqual(directories, [...item.expected].sort(), item.slug);

      const lock = JSON.parse(await readFile(join(output, 'enistere.lock'), 'utf8'));
      assert.deepEqual(lock.sharedPackages.map((entry) => entry.directory).sort(), directories);
    }
  });
});
