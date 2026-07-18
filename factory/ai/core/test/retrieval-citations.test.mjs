/**
 * Tests for AI Core retrieval source citation helpers.
 *
 * Run:
 *   node --test factory/ai/core/test/retrieval-citations.test.mjs
 */

import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { buildContext } from '../src/context/index.mjs';
import { REDACTED } from '../src/redaction/index.mjs';
import {
  createCitationsFromContext,
  createRetrievalCitations,
  describeRetrievalCitationsForLog,
  formatRetrievalCitation,
  normalizeRetrievalSource,
} from '../src/retrieval/index.mjs';

test('normalizes a safe retrieval source into bounded citation metadata', () => {
  const result = normalizeRetrievalSource({
    path: 'docs/project-status/NEXT_ACTIONS.md',
    title: ' Next actions   ',
    section: ' AI Core ',
    lines: { start: 12, end: 18 },
    commit: '7a2d93e',
    score: 0.987654,
    excerpt: 'Governed local retrieval source.',
  });

  assert.equal(result.skipped, null);
  assert.deepEqual(result.citation, {
    id: 'S1',
    path: 'docs/project-status/NEXT_ACTIONS.md',
    title: 'Next actions',
    section: 'AI Core',
    lines: { start: 12, end: 18 },
    commit: '7a2d93e',
    score: 0.9877,
    excerpt: 'Governed local retrieval source.',
  });
  assert.deepEqual(result.redactedKinds, []);
});

test('redacts citation excerpts and never exposes secrets through results', () => {
  const result = createRetrievalCitations({
    sources: [
      {
        path: 'strategy/10_AI_STRATEGY.md',
        excerpt: 'JWT_SECRET=super-secret-value and contact maintainer@example.com',
      },
    ],
  });

  const serialized = JSON.stringify(result);
  assert.ok(!serialized.includes('super-secret-value'));
  assert.ok(!serialized.includes('maintainer@example.com'));
  assert.ok(serialized.includes(REDACTED));
  assert.ok(result.redactedKinds.includes('env_secret'));
  assert.ok(result.redactedKinds.includes('email'));
});

test('skips unsafe paths and duplicate sources without throwing', () => {
  const result = createRetrievalCitations({
    sources: [
      { path: '.env', excerpt: 'SECRET=value' },
      { path: '../outside.md' },
      { path: 'docs/project-status/NEXT_ACTIONS.md' },
      { path: 'docs/project-status/NEXT_ACTIONS.md', title: 'duplicate' },
    ],
  });

  assert.equal(result.citations.length, 1);
  assert.equal(result.citations[0].id, 'S1');
  assert.equal(result.citations[0].path, 'docs/project-status/NEXT_ACTIONS.md');
  assert.deepEqual(
    result.skippedSources.map((source) => source.reason),
    ['forbidden_secret_file', 'invalid_path', 'duplicate_source'],
  );
});

test('bounds citation count and reports truncation', () => {
  const result = createRetrievalCitations({
    maxCitations: 2,
    sources: [
      { path: 'docs/a.md' },
      { path: 'docs/b.md' },
      { path: 'docs/c.md' },
    ],
  });

  assert.equal(result.citations.length, 2);
  assert.equal(result.truncated, true);
  assert.deepEqual(result.citations.map((citation) => citation.id), ['S1', 'S2']);
});

test('creates citations from context builder included files', async () => {
  const repoRoot = await mkdtemp(join(tmpdir(), 'ai-core-retrieval-'));
  await mkdir(join(repoRoot, 'docs'), { recursive: true });
  await writeFile(join(repoRoot, 'docs', 'source.md'), 'Safe source content.\n', 'utf8');

  const context = await buildContext({
    repoRoot,
    files: ['docs/source.md'],
    promptId: 'execution-template',
    promptVersion: '1.0.0',
    scope: 'test',
  });

  const result = createCitationsFromContext(context);

  assert.equal(result.citations.length, 1);
  assert.equal(result.citations[0].path, 'docs/source.md');
  assert.equal(result.citations[0].title, 'source');
  assert.deepEqual(result.skippedSources, []);
});

test('formats citations without including excerpts', () => {
  const result = createRetrievalCitations({
    sources: [
      {
        path: 'docs/project-status/NEXT_ACTIONS.md',
        section: 'AI Core',
        lines: { start: 10, end: 12 },
        excerpt: 'This must not appear in formatted citation.',
      },
    ],
  });

  const formatted = formatRetrievalCitation(result.citations[0]);
  assert.equal(formatted, '[S1] docs/project-status/NEXT_ACTIONS.md # AI Core lines 10-12');
  assert.ok(!formatted.includes('This must not appear'));
});

test('describes citations for logs using counts only', () => {
  const result = createRetrievalCitations({
    sources: [
      { path: 'docs/a.md', excerpt: 'a' },
      { path: '.env', excerpt: 'SECRET=value' },
    ],
  });

  assert.deepEqual(describeRetrievalCitationsForLog(result), {
    count: 1,
    skippedCount: 1,
    truncated: false,
  });
});

