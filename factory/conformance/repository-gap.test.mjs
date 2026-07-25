import { it } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { buildRepositoryGap } from './repository-gap.mjs';

const root = resolve(import.meta.dirname, '../..');

it('computes an honest Platform Baseline v2 gap for all six existing runtimes', () => {
  const report = buildRepositoryGap(root);
  assert.equal(report.schemaVersion, '2');
  assert.deepEqual(Object.keys(report.summary), ['nestjs', 'spring', 'nextjs', 'angular', 'react-native', 'flutter']);
  assert.ok(Object.values(report.summary).every((summary) => summary.conformant === false));
  assert.ok(report.apps.every((app) => app.diagnostics.length > 0));
  assert.equal(report.summary.nestjs.missing, 0);
  assert.equal(report.summary.spring.missing, 0);
  assert.ok(report.summary.nestjs.partial > 0);
  assert.ok(report.summary.spring.partial > 0);
});
