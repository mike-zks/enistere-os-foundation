import { it } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { buildRepositoryGap } from './repository-gap.mjs';

const root = resolve(import.meta.dirname, '../..');

it('computes an honest Platform Baseline v2 gap for all seven existing runtimes', () => {
  const report = buildRepositoryGap(root);
  assert.equal(report.schemaVersion, '2');
  assert.deepEqual(Object.keys(report.summary), ['nestjs', 'spring', 'fastapi', 'nextjs', 'angular', 'react-native', 'flutter']);
  assert.ok(['nextjs', 'angular', 'react-native', 'flutter']
    .every((runtime) => report.summary[runtime].conformant === false));
  assert.equal(report.summary.nestjs.missing, 0);
  assert.equal(report.summary.spring.missing, 0);
  assert.equal(report.summary.fastapi.missing, 0);
  assert.equal(report.summary.nestjs.partial, 0);
  assert.equal(report.summary.spring.partial, 0);
  assert.equal(report.summary.fastapi.partial, 0);
  assert.equal(report.summary.nestjs.conformant, true);
  assert.equal(report.summary.spring.conformant, true);
  assert.equal(report.summary.fastapi.conformant, true);
  assert.equal(report.apps.find((app) => app.runtime === 'nestjs').diagnostics.length, 0);
  assert.equal(report.apps.find((app) => app.runtime === 'spring').diagnostics.length, 0);
  assert.equal(report.apps.find((app) => app.runtime === 'fastapi').diagnostics.length, 0);
});
