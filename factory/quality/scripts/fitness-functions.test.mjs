import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadStarterManifests } from '../../engine/starters.mjs';
import { loadCapabilityManifests } from '../../engine/capabilities.mjs';
import {
  runFitnessFunctions,
  runPipelineFitnessFunctions,
  ingestionBoundaryFindings,
  staticImports,
  REPO_ROOT,
} from './fitness-functions.mjs';

describe('architecture fitness functions', () => {
  it('the real Foundation satisfies all fitness functions', async () => {
    const starters = await loadStarterManifests(REPO_ROOT);
    const capabilities = await loadCapabilityManifests(REPO_ROOT);
    const report = runFitnessFunctions({ starters, capabilities });
    assert.deepEqual(report.findings, []);
    assert.equal(report.passed, true);
  });

  it('flags a capability that both requires and conflicts the same capability', async () => {
    const starters = await loadStarterManifests(REPO_ROOT);
    const capabilities = await loadCapabilityManifests(REPO_ROOT);
    const reason = 'test-only conflict';
    const poisoned = capabilities.map((cap) => {
      if (cap.id === 'rbac') return { ...cap, conflicts: [{ id: 'auth', reason }] };
      if (cap.id === 'auth') return { ...cap, conflicts: [{ id: 'rbac', reason }] };
      return cap;
    });
    const report = runFitnessFunctions({ starters, capabilities: poisoned });
    assert.equal(report.passed, false);
    assert.ok(report.findings.some((f) => f.rule === 'capability-contradiction' && f.detail.includes('rbac')));
  });

  it('flags a requirement on an unknown capability', async () => {
    const starters = await loadStarterManifests(REPO_ROOT);
    const capabilities = await loadCapabilityManifests(REPO_ROOT);
    const poisoned = capabilities.map((cap) => (cap.id === 'files' ? { ...cap, requires: [...cap.requires, 'ghost'] } : cap));
    const report = runFitnessFunctions({ starters, capabilities: poisoned });
    assert.ok(report.findings.some((f) => f.rule === 'capability-closure' && f.detail.includes('ghost')));
  });

  it('forbids the legacy baseSource indirection', async () => {
    const starters = await loadStarterManifests(REPO_ROOT);
    const capabilities = await loadCapabilityManifests(REPO_ROOT);
    const poisoned = starters.map((starter) => (
      starter.id === 'angular'
        ? { ...starter, composition: { ...starter.composition, baseSource: 'starters/angular/base' } }
        : starter
    ));
    const report = runFitnessFunctions({ starters: poisoned, capabilities });
    assert.ok(report.findings.some(
      (finding) => finding.rule === 'single-source' && finding.detail.includes('baseSource'),
    ));
  });

  it('forbids capability implementations embedded in Mobile runtime sources', async () => {
    const starters = await loadStarterManifests(REPO_ROOT);
    const capabilities = await loadCapabilityManifests(REPO_ROOT);
    const report = runFitnessFunctions({
      starters,
      capabilities,
      repoRoot: '/virtual',
      pathExists: (path) => path === '/virtual/starters/react-native/src/notifications',
    });
    assert.ok(report.findings.some(
      (finding) => finding.rule === 'capability-free-runtime'
        && finding.detail.includes('src/notifications'),
    ));
  });
});

describe('pipeline fitness functions (ADR-046 boundary, FF6–FF8)', () => {
  it('the real single canonical pipeline satisfies FF6–FF8', () => {
    const report = runPipelineFitnessFunctions({ repoRoot: REPO_ROOT });
    assert.deepEqual(report.findings, []);
    assert.equal(report.passed, true);
  });

  it('FF6 flags a downstream module that imports the ingestion layer', () => {
    const byPath = ingestionBoundaryFindings('factory/engine/resolver.mjs', "import { normalizeBlueprint } from '../blueprint/normalize.mjs';");
    // Both the blueprint-path rule and the forbidden-symbol rule fire.
    assert.ok(byPath.length >= 1);
    assert.ok(byPath.every((f) => f.rule === 'ingestion-boundary'));
    assert.ok(byPath.some((f) => f.detail.includes('normalizeBlueprint')));

    const bySymbol = ingestionBoundaryFindings('x.mjs', "import { resolveStack } from './applications.mjs';");
    assert.ok(bySymbol.some((f) => f.rule === 'ingestion-boundary' && f.detail.includes('resolveStack')));
  });

  it('FF6 accepts a downstream module that only imports pure layers', () => {
    const clean = ingestionBoundaryFindings('factory/model/generation-plan.mjs', "import { stableDigest } from './canonical-system.mjs';\nimport { deepFreeze } from './immutable.mjs';");
    assert.deepEqual(clean, []);
  });

  it('staticImports parses default, named and aliased imports', () => {
    const parsed = staticImports("import a from 'x';\nimport { b, c as d } from 'y';\nimport { e } from 'z';");
    assert.deepEqual(parsed, [
      { names: ['a'], from: 'x' },
      { names: ['b', 'c'], from: 'y' },
      { names: ['e'], from: 'z' },
    ]);
  });
});
