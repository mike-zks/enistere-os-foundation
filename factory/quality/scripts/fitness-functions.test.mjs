import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadStarterManifests } from '../../engine/starters.mjs';
import { loadCapabilityManifests } from '../../engine/capabilities.mjs';
import { runFitnessFunctions, REPO_ROOT } from './fitness-functions.mjs';

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
    const poisoned = capabilities.map((cap) => (cap.id === 'rbac' ? { ...cap, conflicts: ['auth'] } : cap));
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
});
