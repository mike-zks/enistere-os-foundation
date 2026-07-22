import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chainMigrations, migrateArtifact, ARTIFACT_MIGRATIONS } from '../engine/migrations/index.mjs';

describe('migration registry seam (ADR-043)', () => {
  it('chains steps from an older major to the current one', () => {
    const steps = new Map([
      [1, (v) => ({ ...v, major: 2 })],
      [2, (v) => ({ ...v, migrated: true })],
    ]);
    assert.deepEqual(chainMigrations(steps, 1, 3, { major: 1 }), { major: 2, migrated: true });
  });

  it('is a no-op at the current major', () => {
    const value = { schemaVersion: '2' };
    assert.equal(migrateArtifact('capability', 2, value), value);
  });

  it('fails loudly on a gap with no registered step', () => {
    // No breaking major exists yet: migrating a capability from major 1 has no step.
    assert.throws(() => migrateArtifact('capability', 1, {}), /No migration step from major 1/);
    assert.throws(() => migrateArtifact('unknown', 1, {}), /No migrations registered/);
    assert.throws(() => chainMigrations(new Map(), 2, 1, {}), /cannot migrate down/);
  });

  it('registers every versioned artifact kind', () => {
    assert.deepEqual(Object.keys(ARTIFACT_MIGRATIONS).sort(), ['blueprint', 'capability', 'lock', 'overlay', 'starter']);
  });
});
