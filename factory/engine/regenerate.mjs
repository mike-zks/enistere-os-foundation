/**
 * regenerate.mjs — replaces what the Factory owns in an existing project,
 * without touching what its owner made.
 *
 * The whole zone effort (ADR-079 to ADR-082) exists for this: a regeneration
 * may replace the core because no capability writes into it, and because
 * nothing in it depends on the business zone. What that effort could not
 * provide is the other half — telling the Factory's own output apart from work
 * done since. `enistere.inventory.json` provides it: a digest per file, written
 * at generation time.
 *
 * The classification is the whole design:
 *
 *   inventoried + digest matches   the Factory's, and untouched → replaceable
 *   inventoried + digest differs   modified by the owner        → conflict
 *   inventoried + gone from disk   deleted by the owner         → conflict
 *   not inventoried, on disk       the owner's own file         → never touched
 *
 * **No mode of this function overwrites a conflict.** `onConflict: 'abort'`
 * (the default) writes nothing at all; `'keep'` applies every safe change and
 * leaves conflicting files exactly as they are. A regeneration that could
 * destroy work would be worse than no regeneration at all.
 */
import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { generateProject } from './generator.mjs';
import { getTargetAdapter } from './target-adapters.mjs';

/**
 * The migration directories of each application, project-relative.
 *
 * A migration is not code, it is history: it says what has already been done to
 * databases that are not in this repository. Deleting one because the code that
 * needed it is gone does not un-happen it — measured, not supposed: removing
 * Authentication and RBAC from a FastAPI project left a schema stamped
 * `0003_rbac` and a project where `alembic current` itself fails with
 * "Can't locate revision identified by '0003_rbac'". Not a residue: a project
 * that can no longer run any migration at all.
 *
 * So a regeneration never removes one. The result is a chain that stays intact
 * and, at worst, tables no capability uses any more — untidy instead of broken.
 * Reverting a migration is a migration, and it is the owner's to write.
 */
function migrationRoots(plan) {
  return (plan.applications ?? [])
    .map((application) => {
      const directory = getTargetAdapter(application.runtime)?.migrations;
      return directory ? `${application.appDir}/${directory}` : null;
    })
    .filter(Boolean);
}

/** Directory names no inventory and no comparison ever descends into. */
const IGNORED_DIRECTORIES = new Set([
  '.dart_tool', '.expo', '.git', '.gradle', '.next', '.pytest_cache', '.runtime-venv', '.venv',
  '__pycache__', 'build', 'build-test', 'coverage', 'dist', 'node_modules', 'target',
]);

/**
 * Files a regeneration never compares and never writes: the blueprint is the
 * *input* (editing it and regenerating is the point), and the lock and
 * inventory describe the run itself.
 */
const NOT_REGENERATED = new Set(['enistere.yaml']);
const REWRITTEN_WHOLESALE = new Set(['enistere.lock', 'enistere.inventory.json']);

async function digestOf(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

/** Every file under `root`, project-relative, ignoring build output. */
async function filesUnder(root, prefix = '', accumulator = []) {
  let entries;
  try {
    entries = await readdir(prefix ? join(root, prefix) : root, { withFileTypes: true });
  } catch {
    return accumulator;
  }
  for (const entry of entries) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) continue;
      await filesUnder(root, relativePath, accumulator);
    } else accumulator.push(relativePath);
  }
  return accumulator;
}

/**
 * Compares the project on disk against the inventory the Factory left behind.
 * Returns the changes a regeneration would make and the conflicts that stop it.
 */
export async function planRegeneration({ project, fresh, inventory, keepUnder = [] }) {
  const onDisk = new Set(await filesUnder(project));
  const generated = new Set(await filesUnder(fresh));
  const recorded = inventory.files ?? {};

  const conflicts = [];
  const replace = [];
  const create = [];
  const remove = [];
  const untouched = [];
  const preserved = [];
  const retained = [];

  for (const path of new Set([...Object.keys(recorded), ...generated, ...onDisk])) {
    if (NOT_REGENERATED.has(path) || REWRITTEN_WHOLESALE.has(path)) continue;
    const wasGenerated = path in recorded;
    const exists = onDisk.has(path);
    const willGenerate = generated.has(path);

    if (!wasGenerated) {
      // The owner's own file. The Factory only ever collides with it, never
      // claims it — a path it now wants is a conflict, not an overwrite.
      if (exists && willGenerate) conflicts.push({ path, reason: 'owner-created' });
      else if (willGenerate) create.push(path);
      else preserved.push(path);
      continue;
    }

    if (!exists) {
      // Deleted since. Restoring it silently would undo a deliberate act.
      conflicts.push({ path, reason: 'owner-deleted' });
      continue;
    }

    const current = await digestOf(join(project, path));
    if (current !== recorded[path]) {
      conflicts.push({ path, reason: 'owner-modified' });
      continue;
    }
    if (!willGenerate) {
      if (keepUnder.some((root) => path.startsWith(root))) retained.push(path);
      else remove.push(path);
      continue;
    }
    const next = await digestOf(join(fresh, path));
    if (next === current) untouched.push(path);
    else replace.push(path);
  }

  const sorted = (list) => list.sort();
  return {
    conflicts: conflicts.sort((a, b) => (a.path < b.path ? -1 : 1)),
    replace: sorted(replace),
    create: sorted(create),
    remove: sorted(remove),
    untouched: sorted(untouched),
    // The owner's own files: not counted as "unchanged", because the Factory
    // never had an opinion about them in the first place.
    preserved: sorted(preserved),
    // Files the Factory no longer produces and deliberately leaves behind.
    retained: sorted(retained),
  };
}

async function copyInto(fresh, project, path) {
  const destination = join(project, path);
  await mkdir(dirname(destination), { recursive: true });
  await cp(join(fresh, path), destination);
}

/**
 * Removes the directories a removal just emptied, climbing until something is
 * left. Without this, dropping a capability leaves `src/modules/auth/` standing
 * and empty — the project would still *look* like it carries it.
 *
 * It stops at the first non-empty directory, so a directory holding anything of
 * the owner's survives.
 */
async function pruneEmptyDirectories(project, removedPaths) {
  const candidates = [...new Set(removedPaths.map((path) => dirname(path)))]
    // Deepest first, so a parent is only considered once its children are gone.
    .sort((a, b) => b.split('/').length - a.split('/').length);
  for (let directory of candidates) {
    while (directory && directory !== '.' && !directory.startsWith('..')) {
      let entries;
      try {
        entries = await readdir(join(project, directory));
      } catch { break; }
      if (entries.length > 0) break;
      await rm(join(project, directory), { recursive: true, force: true });
      directory = dirname(directory);
    }
  }
}

/**
 * Regenerates `project` in place with the current Foundation.
 *
 * `onConflict`: `'abort'` (default) writes nothing when any conflict exists;
 * `'keep'` applies every safe change and leaves conflicting files untouched.
 * `dryRun` reports the same plan and writes nothing either way.
 */
export async function regenerateProject(project, options = {}) {
  const { onConflict = 'abort', dryRun = false } = options;
  if (!['abort', 'keep'].includes(onConflict)) {
    throw new Error(`Unknown onConflict mode: ${onConflict}`);
  }

  const blueprint = JSON.parse(await readFile(join(project, 'enistere.yaml'), 'utf8'));
  let inventory;
  try {
    inventory = JSON.parse(await readFile(join(project, 'enistere.inventory.json'), 'utf8'));
  } catch {
    throw new Error(
      'No enistere.inventory.json: this project predates the inventory and cannot be '
      + 'regenerated safely — the Factory cannot tell its own output from your work.',
    );
  }

  const scratch = await mkdtemp(join(tmpdir(), 'enistere-regen-'));
  const fresh = join(scratch, 'project');
  try {
    const plan = await generateProject(blueprint, fresh);
    const changes = await planRegeneration({
      project, fresh, inventory, keepUnder: migrationRoots(plan),
    });
    const applied = !dryRun && (changes.conflicts.length === 0 || onConflict === 'keep');

    if (applied) {
      for (const path of changes.remove) await rm(join(project, path), { force: true });
      for (const path of [...changes.replace, ...changes.create]) await copyInto(fresh, project, path);
      await pruneEmptyDirectories(project, changes.remove);
      // The lock and the inventory describe the run that just happened, so they
      // are taken from it wholesale rather than compared.
      for (const path of REWRITTEN_WHOLESALE) await copyInto(fresh, project, path);
    }

    return {
      project,
      applied,
      onConflict,
      dryRun,
      plan,
      capabilities: plan.capabilities,
      ...changes,
      counts: {
        replace: changes.replace.length,
        create: changes.create.length,
        remove: changes.remove.length,
        untouched: changes.untouched.length,
        preserved: changes.preserved.length,
        retained: changes.retained.length,
        conflicts: changes.conflicts.length,
      },
    };
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}
