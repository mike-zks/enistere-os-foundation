/**
 * AI Core Evaluation Harness tests.
 *
 * Run:
 *   node --test cores/ai-core/test/evaluation-harness.test.mjs
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateAiOutput } from '../src/evaluation/index.mjs';

function codes(result) {
  return result.findings.map((finding) => finding.code);
}

test('passes a complete local mission report', () => {
  const result = evaluateAiOutput({
    outputText: [
      'Summary: AI Core 6 completed.',
      'Files: cores/ai-core/src/evaluation/evaluation-harness.mjs.',
      'Verification: node --test cores/ai-core/test/evaluation-harness.test.mjs.',
      'Verification: quality-gates docs.',
      'Verification: git diff --check.',
      'Documents read: strategy/10_AI_STRATEGY.md.',
      'Limits: no provider, no network.',
      'Next: AI Core 7.',
    ].join('\n'),
    report: {
      summary: 'done',
      files: ['cores/ai-core/src/evaluation/evaluation-harness.mjs'],
      verification: ['node --test cores/ai-core/test/evaluation-harness.test.mjs'],
      limits: ['no provider'],
      next: 'AI Core 7',
    },
    modifiedFiles: ['cores/ai-core/src/evaluation/evaluation-harness.mjs'],
    allowedFiles: ['cores/ai-core/'],
    requiredDocuments: ['strategy/10_AI_STRATEGY.md'],
    expectedGates: [
      'node --test cores/ai-core/test/evaluation-harness.test.mjs',
      'quality-gates docs',
      'git diff --check',
    ],
  });

  assert.equal(result.status, 'pass');
  assert.equal(result.score, 100);
  assert.deepEqual(result.findings, []);
  assert.deepEqual(result.summary.codes, []);
});

test('fails when modified files are forbidden or outside allowed scope', () => {
  const result = evaluateAiOutput({
    outputText: 'summary files verification limits next npm test',
    report: {
      summary: 'done',
      files: ['done'],
      verification: ['npm test'],
      limits: ['none'],
      next: 'next',
    },
    modifiedFiles: [
      'cores/web-nextjs/src/app/page.tsx',
      '.env',
      'cores/ai-core/src/evaluation/evaluation-harness.mjs',
    ],
    allowedFiles: ['cores/ai-core/'],
    forbiddenFiles: ['cores/web-nextjs'],
  });

  assert.equal(result.status, 'fail');
  assert.ok(codes(result).includes('modified_file_forbidden'));
  assert.ok(codes(result).includes('modified_file_forbidden_path'));
  assert.equal(result.summary.modifiedFileCount, 3);
});

test('fails when an expected verification gate is missing', () => {
  const result = evaluateAiOutput({
    outputText: 'summary files verification limits next npm test',
    report: {
      summary: 'done',
      files: ['done'],
      verification: ['npm test'],
      limits: ['none'],
      next: 'next',
    },
    expectedGates: ['node --test cores/ai-core/test/evaluation-harness.test.mjs'],
  });

  assert.equal(result.status, 'fail');
  assert.deepEqual(codes(result), ['expected_gate_not_reported']);
  assert.equal(result.score, 75);
});

test('warns when documents, sections, and verification evidence are missing', () => {
  const result = evaluateAiOutput({
    outputText: 'Short report without the expected details.',
    report: {
      summary: 'done',
    },
    requiredDocuments: ['docs/project-status/NEXT_ACTIONS.md'],
  });

  assert.equal(result.status, 'warn');
  assert.ok(codes(result).includes('required_document_not_mentioned'));
  assert.ok(codes(result).includes('report_section_missing'));
  assert.ok(codes(result).includes('verification_not_evidenced'));
  assert.equal(result.summary.warned, result.findings.length);
});

test('fails when output contains sensitive-looking data', () => {
  const result = evaluateAiOutput({
    outputText: [
      'summary files verification limits next npm test',
      'Authorization: Bearer abcdefghij.klmnopqrst.uvwxyz',
      'JWT_SECRET=super-secret-value',
      'operator@example.com',
    ].join('\n'),
    report: {
      summary: 'done',
      files: ['done'],
      verification: ['npm test'],
      limits: ['none'],
      next: 'next',
    },
  });

  assert.equal(result.status, 'fail');
  const sensitiveFinding = result.findings.find((finding) => finding.code === 'sensitive_data_detected');
  assert.ok(sensitiveFinding);
  assert.ok(sensitiveFinding.metadata.redactedKinds.includes('authorization'));
  assert.ok(sensitiveFinding.metadata.redactedKinds.includes('env_secret'));
  assert.ok(sensitiveFinding.metadata.redactedKinds.includes('email'));
});

test('throws for invalid array inputs', () => {
  assert.throws(
    () => evaluateAiOutput({ modifiedFiles: ['ok', 1] }),
    /modifiedFiles must be a string array/,
  );
  assert.throws(
    () => evaluateAiOutput({ allowedFiles: 'cores/ai-core' }),
    /allowedFiles must be a string array/,
  );
  assert.throws(
    () => evaluateAiOutput({ forbiddenFiles: [null] }),
    /forbiddenFiles must be a string array/,
  );
  assert.throws(
    () => evaluateAiOutput({ requiredDocuments: [{}] }),
    /requiredDocuments must be a string array/,
  );
  assert.throws(
    () => evaluateAiOutput({ expectedGates: [false] }),
    /expectedGates must be a string array/,
  );
});
