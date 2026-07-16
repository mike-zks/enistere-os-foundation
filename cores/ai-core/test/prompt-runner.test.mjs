/**
 * Tests for AI Core governed prompt execution runner.
 *
 * Run:
 *   node --test cores/ai-core/test/prompt-runner.test.mjs
 */

import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { REDACTED } from '../src/redaction/index.mjs';
import { AiRunnerError, runPromptExecution } from '../src/runner/index.mjs';

async function createFixture() {
  const repoRoot = await mkdtemp(join(tmpdir(), 'ai-core-runner-'));
  await mkdir(join(repoRoot, 'docs'), { recursive: true });
  await mkdir(join(repoRoot, 'prompts', 'global'), { recursive: true });
  await writeFile(join(repoRoot, 'docs', 'mission.md'), 'Mission context without secrets.\n', 'utf8');
  await writeFile(join(repoRoot, 'prompts', 'global', 'execution.md'), 'Prompt body template.\n', 'utf8');

  const prompt = {
    id: 'execution-template',
    version: '1.0.0',
    title: 'Execution Template',
    role: 'executor',
    scope: 'global',
    path: 'prompts/global/execution.md',
    allowedInputs: ['mission-brief'],
    requiredDocuments: ['docs/mission.md'],
    allowedFiles: ['prompts/global/execution.md'],
    forbiddenFiles: ['.env', 'node_modules', 'dist'],
    expectedOutput: 'Governed fake-provider execution.',
    gates: ['scope-review', 'human-review'],
    riskLevel: 'medium',
    status: 'active',
  };

  return {
    repoRoot,
    registry: {
      schemaVersion: '1.0.0',
      updatedAt: '2026-07-16',
      prompts: [prompt],
    },
    prompt,
  };
}

test('runs an active prompt through the fake provider and returns a valid report', async () => {
  const fixture = await createFixture();

  const result = await runPromptExecution({
    repoRoot: fixture.repoRoot,
    registry: fixture.registry,
    promptId: fixture.prompt.id,
    promptVersion: fixture.prompt.version,
    input: 'Use the mission brief and produce a scoped execution report.',
    mission: {
      name: 'AI Core 9',
      scope: 'cores/ai-core',
      objective: 'Add a governed prompt execution runner.',
    },
    gateResults: [
      { command: 'scope-review', status: 'pass', details: 'Prompt scope reviewed.' },
      { command: 'human-review', status: 'not_run', details: 'Human review follows the fake run.' },
    ],
  });

  assert.equal(result.prompt.id, 'execution-template');
  assert.equal(result.completion.providerId, 'fake');
  assert.match(result.completion.output, /Fake completion for execution-template@1\.0\.0/);
  assert.deepEqual(
    result.context.includedFiles.map((file) => file.path).sort(),
    ['docs/mission.md', 'prompts/global/execution.md'],
  );
  assert.equal(result.report.schemaVersion, 'ai-execution-report/v1');
  assert.equal(result.report.status, 'completed');
  assert.equal(result.reportValidation.valid, true);
  assert.deepEqual(result.reportValidation.issues, []);
});

test('redacts input and context before provider output and report are returned', async () => {
  const fixture = await createFixture();
  await writeFile(
    join(fixture.repoRoot, 'docs', 'mission.md'),
    'JWT_SECRET=super-secret-value\nContact: maintainer@example.com\n',
    'utf8',
  );

  const result = await runPromptExecution({
    repoRoot: fixture.repoRoot,
    registry: fixture.registry,
    promptId: fixture.prompt.id,
    input: 'Authorization: Bearer abcdefghij.klmnopqrst.uvwxyz',
  });

  const serialized = JSON.stringify(result);
  assert.ok(!serialized.includes('super-secret-value'));
  assert.ok(!serialized.includes('maintainer@example.com'));
  assert.ok(!serialized.includes('abcdefghij.klmnopqrst.uvwxyz'));
  assert.ok(serialized.includes(REDACTED));
  assert.ok(result.completion.safety.redactedKinds.includes('authorization'));
  assert.ok(result.context.redactedKinds.includes('env_secret'));
});

test('refuses context files outside the prompt allow-list before provider execution', async () => {
  const fixture = await createFixture();

  await assert.rejects(
    () => runPromptExecution({
      repoRoot: fixture.repoRoot,
      registry: fixture.registry,
      promptId: fixture.prompt.id,
      input: 'Run with extra file.',
      contextFiles: ['docs/mission.md', 'docs/other.md'],
    }),
    (error) => error instanceof AiRunnerError &&
      error.code === 'context_invalid' &&
      error.operation === 'build_context',
  );
});

test('refuses missing required context before provider execution', async () => {
  const fixture = await createFixture();
  fixture.registry.prompts[0] = {
    ...fixture.prompt,
    requiredDocuments: ['docs/missing.md'],
  };

  await assert.rejects(
    () => runPromptExecution({
      repoRoot: fixture.repoRoot,
      registry: fixture.registry,
      promptId: fixture.prompt.id,
      input: 'Run with missing context.',
    }),
    (error) => error instanceof AiRunnerError &&
      error.code === 'context_invalid' &&
      error.metadata.missingFiles.includes('docs/missing.md'),
  );
});

test('refuses inactive prompts', async () => {
  const fixture = await createFixture();
  fixture.registry.prompts[0] = {
    ...fixture.prompt,
    status: 'draft',
  };

  await assert.rejects(
    () => runPromptExecution({
      repoRoot: fixture.repoRoot,
      registry: fixture.registry,
      promptId: fixture.prompt.id,
      input: 'Run inactive prompt.',
    }),
    (error) => error instanceof AiRunnerError &&
      error.code === 'prompt_inactive' &&
      error.operation === 'resolve_prompt',
  );
});

test('does not include raw prompt input payload fields in the execution report', async () => {
  const fixture = await createFixture();

  const result = await runPromptExecution({
    repoRoot: fixture.repoRoot,
    registry: fixture.registry,
    promptId: fixture.prompt.id,
    input: 'This input must not appear as promptText/rawPrompt/messages in the report.',
  });

  assert.equal(Object.hasOwn(result.report, 'promptText'), false);
  assert.equal(Object.hasOwn(result.report, 'rawPrompt'), false);
  assert.equal(Object.hasOwn(result.report, 'messages'), false);
  assert.equal(result.report.prompt.id, fixture.prompt.id);
  assert.ok(!JSON.stringify(result.report).includes('This input must not appear'));
});

