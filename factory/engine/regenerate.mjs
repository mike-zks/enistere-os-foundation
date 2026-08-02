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
import { cp, lstat, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
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

/**
 * Every regular file and non-regular obstruction under `root`, project-relative.
 *
 * A symlink is deliberately not a file here. Reading or copying through it
 * would let a path that appears project-relative reach outside the project.
 * Sockets, devices and FIFOs receive the same conservative treatment: none is
 * a file the Factory may digest or replace.
 */
async function entriesUnder(root, prefix = '', accumulator = { files: [], obstructions: [] }) {
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
      await entriesUnder(root, relativePath, accumulator);
    } else if (entry.isFile()) accumulator.files.push(relativePath);
    else accumulator.obstructions.push(relativePath);
  }
  return accumulator;
}

function atOrBelow(path, root) {
  return path === root || path.startsWith(`${root}/`);
}

function obstructionFor(path, obstructions) {
  return obstructions.find((obstruction) => atOrBelow(path, obstruction));
}

function blockedByConflict(path, conflicts) {
  return conflicts.some((conflict) => atOrBelow(path, conflict.path));
}

/** Refuses a mutation path whose current destination or ancestor is not regular. */
async function assertSafeMutationPath(project, path) {
  const parts = path.split('/');
  let current = project;
  for (const [index, part] of parts.entries()) {
    current = join(current, part);
    let status;
    try {
      status = await lstat(current);
    } catch (error) {
      if (error.code === 'ENOENT') return;
      throw error;
    }
    const destination = index === parts.length - 1;
    if (status.isSymbolicLink() || (!destination && !status.isDirectory())
      || (destination && !status.isFile())) {
      throw new Error(`Unsafe regeneration path: ${path} crosses non-regular entry ${parts.slice(0, index + 1).join('/')}`);
    }
  }
}

/**
 * Compares the project on disk against the inventory the Factory left behind.
 * Returns the changes a regeneration would make and the conflicts that stop it.
 */
export async function planRegeneration({ project, fresh, inventory, keepUnder = [] }) {
  const diskEntries = await entriesUnder(project);
  const freshEntries = await entriesUnder(fresh);
  if (freshEntries.obstructions.length > 0) {
    throw new Error(`Generated project contains non-regular entries: ${freshEntries.obstructions.join(', ')}`);
  }
  const onDisk = new Set(diskEntries.files);
  const generated = new Set(freshEntries.files);
  const recorded = inventory.files ?? {};
  const recordedPaths = Object.keys(recorded);

  const conflicts = [];
  const replace = [];
  const create = [];
  const remove = [];
  const untouched = [];
  const preserved = [];
  const retained = [];

  // Directories are not inventoried, so a symlink placed where the next
  // generation wants a directory used to be invisible: every descendant was
  // classified as `create`, and mkdir/cp followed the link outside the project.
  // Collapse that whole subtree to one conflict and never schedule its files.
  for (const path of diskEntries.obstructions) {
    const replacesFactoryWork = path in recorded
      || recordedPaths.some((recordedPath) => atOrBelow(recordedPath, path));
    const collidesWithGeneration = generated.has(path)
      || [...generated].some((generatedPath) => atOrBelow(generatedPath, path));
    if (replacesFactoryWork || collidesWithGeneration) {
      conflicts.push({
        path,
        reason: replacesFactoryWork ? 'owner-modified' : 'owner-created',
      });
    } else preserved.push(path);
  }

  for (const path of new Set([...recordedPaths, ...generated, ...onDisk])) {
    if (NOT_REGENERATED.has(path) || REWRITTEN_WHOLESALE.has(path)) continue;
    if (obstructionFor(path, diskEntries.obstructions)) continue;
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
  let previousIdentity = null;
  if (inventory.files?.['enistere.identity.json']) {
    const identityPath = join(project, 'enistere.identity.json');
    let status;
    try { status = await lstat(identityPath); } catch { status = null; }
    if (!status?.isFile()
      || await digestOf(identityPath) !== inventory.files['enistere.identity.json']) {
      throw new Error(
        'enistere.identity.json is missing or modified: immutable application identities '
        + 'cannot be verified, so regeneration is refused.',
      );
    }
    previousIdentity = JSON.parse(await readFile(identityPath, 'utf8'));
  }

  const scratch = await mkdtemp(join(tmpdir(), 'enistere-regen-'));
  const fresh = join(scratch, 'project');
  try {
    const plan = await generateProject(blueprint, fresh);
    const previousApplications = previousIdentity?.applications?.map((application) => application.id) ?? [];
    const nextApplications = new Set(plan.applications.map((application) => application.id));
    const removedApplication = previousApplications.find((id) => !nextApplications.has(id));
    if (previousIdentity && (previousIdentity.project !== plan.project || removedApplication)) {
      throw new Error(
        'Project and application ids are immutable after delivery: changing them alters external '
        + 'package, service and native application coordinates. Create a new project or use a future '
        + 'explicit rename migration instead of regenerate.',
      );
    }
    const changes = await planRegeneration({
      project, fresh, inventory, keepUnder: migrationRoots(plan),
    });
    const applied = !dryRun && (changes.conflicts.length === 0 || onConflict === 'keep');

    if (applied) {
      const wholesale = [...REWRITTEN_WHOLESALE]
        .filter((path) => !blockedByConflict(path, changes.conflicts));
      // Repeat the boundary check after planning and before the first write.
      // This does not claim a multi-file transaction; it prevents a persistent
      // obstruction (or one introduced during planning) from being followed.
      for (const path of [
        ...changes.remove, ...changes.replace, ...changes.create, ...wholesale,
      ]) {
        await assertSafeMutationPath(project, path);
      }
      for (const path of changes.remove) await rm(join(project, path), { force: true });
      for (const path of [...changes.replace, ...changes.create]) await copyInto(fresh, project, path);
      await pruneEmptyDirectories(project, changes.remove);
      // The lock and the inventory describe the run that just happened, so they
      // are taken from it wholesale rather than compared.
      for (const path of wholesale) await copyInto(fresh, project, path);
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
