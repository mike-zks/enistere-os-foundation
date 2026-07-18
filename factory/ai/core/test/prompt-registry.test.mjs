/**
 * Tests for AI Core prompt registry.
 *
 * Run:
 *   node --test factory/ai/core/test/prompt-registry.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  PROMPT_ROLES,
  validatePromptDefinition,
  validatePromptRegistryShape,
} from '../src/prompt-registry/model.mjs';
import {
  formatRegistryIssues,
  validatePromptRegistryFile,
  validatePromptRegistryReferences,
} from '../src/prompt-registry/validator.mjs';

function validPrompt(overrides = {}) {
  return {
    id: 'sample-prompt',
    version: '1.0.0',
    title: 'Sample Prompt',
    role: 'reviewer',
    scope: 'review',
    path: 'factory/ai/prompts/review/sample.md',
    allowedInputs: ['diff'],
    requiredDocuments: ['strategy/10_AI_STRATEGY.md'],
    allowedFiles: ['factory/ai/prompts/review/sample.md'],
    forbiddenFiles: ['.env', 'node_modules'],
    expectedOutput: 'A bounded review report.',
    gates: ['scope-review', 'human-review'],
    riskLevel: 'medium',
    status: 'active',
    ...overrides,
  };
}

function validRegistry(overrides = {}) {
  return {
    schemaVersion: '1.0.0',
    updatedAt: '2026-07-16',
    prompts: [validPrompt()],
    ...overrides,
  };
}

describe('validatePromptDefinition', () => {
  it('accepts a valid prompt definition', () => {
    assert.deepStrictEqual(validatePromptDefinition(validPrompt()), []);
  });

  it('rejects invalid identifiers, roles, risk levels, and statuses', () => {
    const issues = validatePromptDefinition(validPrompt({
      id: '../secret',
      role: 'admin',
      riskLevel: 'critical',
      status: 'unknown',
    }));

    assert.ok(issues.some((issue) => issue.path.endsWith('.id')));
    assert.ok(issues.some((issue) => issue.path.endsWith('.role')));
    assert.ok(issues.some((issue) => issue.path.endsWith('.riskLevel')));
    assert.ok(issues.some((issue) => issue.path.endsWith('.status')));
  });

  it('rejects unsafe paths and paths outside factory/ai/prompts/', () => {
    const issues = validatePromptDefinition(validPrompt({
      path: '../factory/ai/prompts/sample.md',
      requiredDocuments: ['strategy/../.env'],
      allowedFiles: ['/absolute/path.md'],
      forbiddenFiles: ['build//artifact'],
    }));

    assert.ok(issues.some((issue) => issue.path.endsWith('.path')));
    assert.ok(issues.some((issue) => issue.path.endsWith('.requiredDocuments')));
    assert.ok(issues.some((issue) => issue.path.endsWith('.allowedFiles')));
    assert.ok(issues.some((issue) => issue.path.endsWith('.forbiddenFiles')));
  });

  it('requires bounded non-empty inputs and gates', () => {
    const issues = validatePromptDefinition(validPrompt({
      allowedInputs: [],
      gates: ['curl-prod-provider'],
    }));

    assert.ok(issues.some((issue) => issue.path.endsWith('.allowedInputs')));
    assert.ok(issues.some((issue) => issue.path.endsWith('.gates')));
  });

  it('does not include provider roles or autonomous decision roles', () => {
    assert.ok(!PROMPT_ROLES.includes('provider'));
    assert.ok(!PROMPT_ROLES.includes('autonomous_decider'));
  });
});

describe('validatePromptRegistryShape', () => {
  it('accepts a valid registry shape', () => {
    assert.deepStrictEqual(validatePromptRegistryShape(validRegistry()), []);
  });

  it('rejects unsupported schema versions and malformed dates', () => {
    const issues = validatePromptRegistryShape(validRegistry({
      schemaVersion: '2.0.0',
      updatedAt: '16-07-2026',
    }));

    assert.ok(issues.some((issue) => issue.path === 'schemaVersion'));
    assert.ok(issues.some((issue) => issue.path === 'updatedAt'));
  });

  it('rejects duplicate prompt ids and versions', () => {
    const prompt = validPrompt();
    const issues = validatePromptRegistryShape(validRegistry({
      prompts: [prompt, { ...prompt }],
    }));

    assert.ok(issues.some((issue) => issue.message.includes('duplicate id')));
    assert.ok(issues.some((issue) => issue.message.includes('duplicate prompt version')));
  });
});

describe('validatePromptRegistryReferences', () => {
  it('reports missing prompt and required document files', () => {
    const issues = validatePromptRegistryReferences(validRegistry(), '/tmp/non-existing-ai-core-root');

    assert.ok(issues.some((issue) => issue.message.includes('referenced prompt file does not exist')));
    assert.ok(issues.some((issue) => issue.message.includes('referenced document does not exist')));
  });

  it('accepts existing prompt and required document files', async () => {
    const root = await mkdtemp(join(tmpdir(), 'ai-core-registry-'));
    await mkdir(join(root, 'factory/ai/prompts/review'), { recursive: true });
    await mkdir(join(root, 'strategy'), { recursive: true });
    await writeFile(join(root, 'factory/ai/prompts/review/sample.md'), '# Sample\n');
    await writeFile(join(root, 'strategy/10_AI_STRATEGY.md'), '# Strategy\n');

    assert.deepStrictEqual(validatePromptRegistryReferences(validRegistry(), root), []);
  });
});

describe('validatePromptRegistryFile', () => {
  it('validates a registry JSON file end to end', async () => {
    const root = await mkdtemp(join(tmpdir(), 'ai-core-registry-file-'));
    await mkdir(join(root, 'factory/ai/core'), { recursive: true });
    await mkdir(join(root, 'factory/ai/prompts/review'), { recursive: true });
    await mkdir(join(root, 'strategy'), { recursive: true });
    await writeFile(join(root, 'factory/ai/prompts/review/sample.md'), '# Sample\n');
    await writeFile(join(root, 'strategy/10_AI_STRATEGY.md'), '# Strategy\n');

    const registryPath = join(root, 'factory/ai/core/prompt-registry.json');
    await writeFile(registryPath, JSON.stringify(validRegistry()), 'utf8');

    const result = await validatePromptRegistryFile({ repoRoot: root, registryPath });
    assert.equal(result.ok, true);
    assert.equal(result.issues.length, 0);
  });

  it('returns a controlled issue for invalid JSON', async () => {
    const root = await mkdtemp(join(tmpdir(), 'ai-core-registry-invalid-'));
    const registryPath = join(root, 'registry.json');
    await writeFile(registryPath, '{invalid', 'utf8');

    const result = await validatePromptRegistryFile({ repoRoot: root, registryPath });
    assert.equal(result.ok, false);
    assert.ok(result.issues[0].message.includes('invalid JSON'));
  });
});

describe('formatRegistryIssues', () => {
  it('formats issues without leaking registry content', () => {
    const formatted = formatRegistryIssues([
      { path: 'prompts[0].path', message: 'referenced prompt file does not exist: factory/ai/prompts/x.md' },
    ]);

    assert.match(formatted, /prompts\[0\]\.path/);
    assert.match(formatted, /referenced prompt file does not exist/);
  });

  it('returns a success message for an empty issue list', () => {
    assert.equal(formatRegistryIssues([]), 'Prompt registry is valid.');
  });
});
