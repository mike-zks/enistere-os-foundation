/**
 * Migration registry seam (ADR-043, Contrat 6 du socle).
 *
 * Per artifact kind, pure migrations chained from an older schema major to the
 * current one. Phase 0 freezes this contract; real migration steps are written
 * only when a breaking major is introduced, and `enistere migrate` (Phase C)
 * applies them under human approval. Migrating an artifact already at the current
 * major is a no-op; a gap with no registered step fails loudly rather than
 * silently upgrading.
 */

/** Applies the steps `fromMajor -> ... -> toMajor` in order. Pure. */
export function chainMigrations(steps, fromMajor, toMajor, value) {
  if (!Number.isInteger(fromMajor) || !Number.isInteger(toMajor)) throw new Error('majors must be integers');
  if (fromMajor > toMajor) throw new Error(`cannot migrate down: ${fromMajor} > ${toMajor}`);
  let current = fromMajor;
  let result = value;
  while (current < toMajor) {
    const step = steps.get(current);
    if (typeof step !== 'function') throw new Error(`No migration step from major ${current}`);
    result = step(result);
    current += 1;
  }
  return result;
}

/**
 * Current schema major and migration steps per artifact kind. Steps are empty
 * until a breaking major exists — a same-major migration is a no-op, an older
 * major fails until a step is written.
 */
export const ARTIFACT_MIGRATIONS = Object.freeze({
  blueprint: Object.freeze({ toMajor: 1, steps: new Map() }),
  capability: Object.freeze({ toMajor: 2, steps: new Map() }),
  starter: Object.freeze({ toMajor: 2, steps: new Map() }),
  overlay: Object.freeze({ toMajor: 1, steps: new Map() }),
  lock: Object.freeze({ toMajor: 1, steps: new Map() }),
});

export function migrateArtifact(kind, fromMajor, value) {
  const registry = ARTIFACT_MIGRATIONS[kind];
  if (!registry) throw new Error(`No migrations registered for artifact kind: ${kind}`);
  return chainMigrations(registry.steps, fromMajor, registry.toMajor, value);
}
