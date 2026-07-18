/**
 * Tests for Factory AI Context Builder.
 *
 * Run:
 *   node --test factory/ai/runtime/test/context-builder.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildContext,
  classifyContextPath,
  normalizeContextPath,
} from '../src/context/index.mjs';
import { REDACTED } from '../src/redaction/index.mjs';

async function createRepo() {
  const root = await mkdtemp(join(tmpdir(), 'ai-core-context-'));
  await mkdir(join(root, 'strategy'), { recursive: true });
  await mkdir(join(root, 'factory/ai/prompts/global'), { recursive: true });
  await mkdir(join(root, 'node_modules/pkg'), { recursive: true });
  await writeFile(join(root, 'strategy/10_AI_STRATEGY.md'), 'Contact jane@example.com\nTOKEN=secret\n');
  await writeFile(join(root, 'factory/ai/prompts/global/master-context.md'), '# Master\nAuthorization: Bearer abc.def.ghijklmnop\n');
  await writeFile(join(root, '.env'), 'PASSWORD=secret\n');
  await writeFile(join(root, 'node_modules/pkg/index.js'), 'module.exports = 1;\n');
  return root;
}

describe('normalizeContextPath', () => {
  it('normalizes simple relative paths', () => {
    assert.equal(normalizeContextPath('./strategy/10_AI_STRATEGY.md'), 'strategy/10_AI_STRATEGY.md');
    assert.equal(normalizeContextPath('factory\\ai\\prompts\\global\\master-context.md'), 'factory/ai/prompts/global/master-context.md');
  });

  it('rejects unsafe paths', () => {
    assert.equal(normalizeContextPath('/etc/passwd'), null);
    assert.equal(normalizeContextPath('../secret'), null);
    assert.equal(normalizeContextPath('strategy//x.md'), null);
    assert.equal(normalizeContextPath(''), null);
    assert.equal(normalizeContextPath(null), null);
  });
});

describe('classifyContextPath', () => {
  it('allows ordinary repository paths', () => {
    assert.deepEqual(classifyContextPath('strategy/10_AI_STRATEGY.md'), {
      allowed: true,
      path: 'strategy/10_AI_STRATEGY.md',
      reason: null,
    });
  });

  it('blocks secret files and build/dependency segments', () => {
    assert.deepEqual(classifyContextPath('.env'), {
      allowed: false,
      path: '.env',
      reason: 'forbidden_secret_file',
    });
    assert.deepEqual(classifyContextPath('node_modules/pkg/index.js'), {
      allowed: false,
      path: 'node_modules/pkg/index.js',
      reason: 'forbidden_segment',
    });
    assert.deepEqual(classifyContextPath('dist/app.js'), {
      allowed: false,
      path: 'dist/app.js',
      reason: 'forbidden_segment',
    });
  });
});

describe('buildContext', () => {
  it('builds a redacted context from explicit files only', async () => {
    const repoRoot = await createRepo();
    const context = await buildContext({
      repoRoot,
      promptId: 'master-context',
      promptVersion: '1.0.0',
      scope: 'global',
      files: [
        'strategy/10_AI_STRATEGY.md',
        'factory/ai/prompts/global/master-context.md',
      ],
    });

    assert.match(context.safeText, /promptId: master-context/);
    assert.match(context.safeText, /## strategy\/10_AI_STRATEGY\.md/);
    assert.match(context.safeText, /## factory\/ai\/prompts\/global\/master-context\.md/);
    assert.ok(!context.safeText.includes('jane@example.com'));
    assert.ok(!context.safeText.includes('TOKEN=secret'));
    assert.ok(!context.safeText.includes('abc.def.ghijklmnop'));
    assert.match(context.safeText, new RegExp(REDACTED.replace('[', '\\[').replace(']', '\\]')));
    assert.deepEqual(context.missingFiles, []);
    assert.deepEqual(context.skippedFiles, []);
    assert.equal(context.includedFiles.length, 2);
    assert.ok(context.redactedKinds.includes('email'));
    assert.ok(context.redactedKinds.includes('env_secret'));
    assert.ok(context.redactedKinds.includes('authorization'));
  });

  it('skips forbidden paths and reports missing files without throwing', async () => {
    const repoRoot = await createRepo();
    const context = await buildContext({
      repoRoot,
      files: [
        '.env',
        'node_modules/pkg/index.js',
        '../outside',
        'missing.md',
        'strategy/10_AI_STRATEGY.md',
      ],
    });

    assert.equal(context.includedFiles.length, 1);
    assert.deepEqual(context.missingFiles, ['missing.md']);
    assert.ok(context.skippedFiles.some((file) => file.path === '.env' && file.reason === 'forbidden_secret_file'));
    assert.ok(context.skippedFiles.some((file) => file.path === 'node_modules/pkg/index.js' && file.reason === 'forbidden_segment'));
    assert.ok(context.skippedFiles.some((file) => file.path === '../outside' && file.reason === 'invalid_path'));
    assert.ok(!context.safeText.includes('PASSWORD=secret'));
    assert.ok(!context.safeText.includes('node_modules'));
  });

  it('deduplicates requested files', async () => {
    const repoRoot = await createRepo();
    const context = await buildContext({
      repoRoot,
      files: [
        'strategy/10_AI_STRATEGY.md',
        'strategy/10_AI_STRATEGY.md',
      ],
    });

    assert.equal(context.includedFiles.length, 1);
    assert.equal((context.safeText.match(/## strategy\/10_AI_STRATEGY\.md/g) ?? []).length, 1);
  });

  it('truncates oversized files', async () => {
    const repoRoot = await createRepo();
    await mkdir(join(repoRoot, 'docs'), { recursive: true });
    await writeFile(join(repoRoot, 'docs/large.md'), 'x'.repeat(200));

    const context = await buildContext({
      repoRoot,
      files: ['docs/large.md'],
      maxFileBytes: 25,
    });

    assert.equal(context.includedFiles[0].truncated, true);
    assert.equal(context.truncated, true);
    assert.ok(context.warnings.includes('file_truncated'));
    assert.ok(!context.safeText.includes('x'.repeat(200)));
  });

  it('stops when maxTotalBytes is reached', async () => {
    const repoRoot = await createRepo();
    await mkdir(join(repoRoot, 'docs'), { recursive: true });
    await writeFile(join(repoRoot, 'docs/a.md'), 'a'.repeat(100));
    await writeFile(join(repoRoot, 'docs/b.md'), 'b'.repeat(100));

    const context = await buildContext({
      repoRoot,
      files: ['docs/a.md', 'docs/b.md'],
      maxTotalBytes: 170,
    });

    assert.equal(context.includedFiles.length, 1);
    assert.ok(context.skippedFiles.some((file) => file.path === 'docs/b.md' && file.reason === 'max_total_bytes'));
    assert.equal(context.truncated, true);
    assert.ok(context.warnings.includes('context_truncated'));
  });

  it('throws controlled TypeErrors for invalid options', async () => {
    await assert.rejects(() => buildContext(null), /options must be an object/);
    await assert.rejects(() => buildContext({ files: [] }), /repoRoot is required/);
    await assert.rejects(() => buildContext({ repoRoot: '/tmp', files: 'x' }), /files must be an array/);
  });
});
