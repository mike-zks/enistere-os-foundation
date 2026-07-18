/**
 * Factory AI Governance / Execution Report schema tests.
 *
 * Run:
 *   node --test factory/ai/runtime/test/report-schema.test.mjs
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { createExecutionReport, validateExecutionReport } from '../src/reports/index.mjs';

function validInput(overrides = {}) {
  return {
    status: 'completed',
    mission: {
      name: 'Factory AI 8',
      scope: 'factory/ai/runtime',
      objective: 'Define a local execution report schema.',
    },
    prompt: {
      id: 'global.mission',
      version: '1.0.0',
      role: 'architect',
    },
    documentsRead: [
      'docs/project-status/NEXT_ACTIONS.md',
      'factory/ai/runtime/AI_RUNTIME_SPECIFICATION.md',
    ],
    modifiedFiles: [
      'factory/ai/runtime/src/reports/execution-report.mjs',
    ],
    gates: [
      { command: 'node --test factory/ai/runtime/test/report-schema.test.mjs', status: 'pass' },
      { command: 'node factory/quality/scripts/quality-gates.mjs run docs', status: 'pass' },
    ],
    limits: ['No provider, no network, no external storage.'],
    evaluation: {
      status: 'pass',
      score: 100,
      findings: [],
    },
    nextAction: 'Factory AI V1 Readiness Review.',
    ...overrides,
  };
}

test('creates and validates a complete execution report', () => {
  const report = createExecutionReport(validInput());
  const validation = validateExecutionReport(report);

  assert.equal(report.schemaVersion, 'ai-execution-report/v1');
  assert.equal(report.status, 'completed');
  assert.equal(report.prompt.id, 'global.mission');
  assert.equal(report.documentsRead.length, 2);
  assert.equal(report.gates[0].status, 'pass');
  assert.deepEqual(report.redactedKinds, []);
  assert.deepEqual(report.validationIssues, []);
  assert.deepEqual(validation, { valid: true, issues: [] });
});

test('redacts sensitive-looking content before returning the report', () => {
  const report = createExecutionReport(validInput({
    documentsRead: ['docs/project-status/NEXT_ACTIONS.md?token=abc123'],
    gates: [
      {
        command: 'curl -H "Authorization: Bearer abcdefghij.klmnopqrst.uvwxyz" https://example.test',
        status: 'pass',
      },
    ],
    evaluation: {
      status: 'warn',
      score: 80,
      findings: [{ code: 'note', metadata: { email: 'operator@example.com' } }],
    },
    nextAction: 'Rotate JWT_SECRET=super-secret-value if it was exposed.',
  }));

  const serialized = JSON.stringify(report);
  assert.ok(!serialized.includes('abcdefghij.klmnopqrst.uvwxyz'));
  assert.ok(!serialized.includes('operator@example.com'));
  assert.ok(!serialized.includes('super-secret-value'));
  assert.ok(report.redactedKinds.includes('authorization'));
  assert.ok(report.redactedKinds.includes('sensitive_key'));
  assert.ok(report.redactedKinds.includes('env_secret'));
});

test('rejects raw prompt payloads', () => {
  assert.throws(
    () => createExecutionReport(validInput({ promptText: 'full prompt body' })),
    /must not include raw prompt payloads/,
  );

  assert.throws(
    () => createExecutionReport(validInput({ prompt: { id: 'x', rawPrompt: 'full prompt body' } })),
    /must not include raw prompt payloads/,
  );
});

test('records validation issues for incomplete reports', () => {
  const report = createExecutionReport({
    status: 'completed',
    mission: { name: 'Incomplete' },
    prompt: { id: 'global.mission' },
    nextAction: '',
  });
  const validation = validateExecutionReport(report);

  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((issue) => issue.code === 'missing_field' && issue.field === 'documentsRead'));
  assert.ok(validation.issues.some((issue) => issue.code === 'missing_documents'));
  assert.ok(validation.issues.some((issue) => issue.code === 'missing_gates'));
  assert.ok(validation.issues.some((issue) => issue.code === 'missing_next_action'));
});

test('normalizes invalid statuses conservatively', () => {
  const report = createExecutionReport(validInput({
    status: 'done',
    gates: [{ command: 'npm test', status: 'success' }],
    evaluation: { status: 'unknown', score: 150, findings: [] },
  }));

  assert.equal(report.status, 'draft');
  assert.equal(report.gates[0].status, 'not_run');
  assert.equal(report.evaluation.status, 'warn');
  assert.equal(report.evaluation.score, 100);
});

test('deduplicates arrays and truncates oversized arrays', () => {
  const manyDocs = Array.from({ length: 105 }, (_value, index) => `docs/${index}.md`);
  const report = createExecutionReport(validInput({
    documentsRead: ['a.md', 'a.md', 'b.md'],
    modifiedFiles: manyDocs,
  }));

  assert.deepEqual(report.documentsRead, ['a.md', 'b.md']);
  assert.equal(report.modifiedFiles.length, 100);
  assert.ok(report.validationIssues.some((issue) => issue.code === 'too_many_items_truncated'));
});

test('throws when input is not an object', () => {
  assert.throws(
    () => createExecutionReport(null),
    /execution report input must be an object/,
  );

  assert.deepEqual(validateExecutionReport(null), {
    valid: false,
    issues: [{ code: 'invalid_report', field: null }],
  });
});
