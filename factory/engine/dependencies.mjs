import { spawnSync } from 'node:child_process';
import { access, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

/**
 * Dependency finalization for a generated project (unified npm workspace).
 *
 * The Factory generation itself is offline and deterministic: it writes the
 * workspace manifests but cannot resolve the registry. Finalization is the
 * explicit, opt-in step that turns those manifests into a locked, reproducible
 * install:
 *
 *   1. `npm install --package-lock-only --ignore-scripts` — resolve the whole
 *      workspace into the root `package-lock.json` WITHOUT running any lifecycle
 *      script and without writing `node_modules`;
 *   2. `npm ci` — install strictly from that lock (reproducible);
 *   3. record the lock's sha256 digest in `enistere.lock` and flip
 *      `dependenciesLocked` to true.
 *
 * A project generated without this step is honestly marked
 * `dependenciesLocked: false` with a null `lockDigest`.
 */

export const PROJECT_LOCKFILE = 'package-lock.json';
export const PROJECT_MANIFEST = 'enistere.lock';

async function exists(path) {
  try { await access(path, constants.F_OK); return true; } catch { return false; }
}

/** sha256 of the root lockfile bytes, or null when the project is not locked. */
export async function computeLockDigest(projectDir) {
  const lockPath = join(projectDir, PROJECT_LOCKFILE);
  if (!(await exists(lockPath))) return null;
  return createHash('sha256').update(await readFile(lockPath)).digest('hex');
}

async function computeFileDigest(path) {
  if (!(await exists(path))) return null;
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

export async function readProjectManifest(projectDir) {
  const path = join(projectDir, PROJECT_MANIFEST);
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    throw new Error(`Not an Enistere project (missing or invalid ${PROJECT_MANIFEST}): ${projectDir}`);
  }
}

async function writeProjectManifest(projectDir, manifest) {
  await writeFile(join(projectDir, PROJECT_MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
}

function npm(args, cwd) {
  const result = spawnSync('npm', args, { cwd, stdio: 'inherit', shell: false });
  if (result.error) throw new Error(`npm ${args.join(' ')} could not start: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`npm ${args.join(' ')} failed (exit ${result.status ?? `signal ${result.signal}`})`);
}

/**
 * Resolves and locks the workspace, then installs from the lock.
 * Returns the recorded dependency state.
 */
export async function finalizeDependencies(projectDir, options = {}) {
  const { install = true } = options;
  const manifest = await readProjectManifest(projectDir);

  // 1) Deterministic resolution into the root lock — no lifecycle scripts, no node_modules.
  npm(['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund'], projectDir);
  const lockPath = join(projectDir, PROJECT_LOCKFILE);
  if (!(await exists(lockPath))) throw new Error(`Dependency finalization did not produce ${PROJECT_LOCKFILE}`);

  // 2) Reproducible install strictly from the lock.
  if (install) npm(['ci', '--no-audit', '--no-fund'], projectDir);

  // 3) Record the lock identity in enistere.lock.
  const digest = await computeLockDigest(projectDir);
  const lockfileVersion = JSON.parse(await readFile(lockPath, 'utf8')).lockfileVersion ?? null;
  const dependencies = {
    dependenciesLocked: true,
    lockfile: PROJECT_LOCKFILE,
    lockDigest: digest,
    lockfileVersion,
  };
  await writeProjectManifest(projectDir, { ...manifest, ...dependencies });
  return dependencies;
}

/**
 * Verifies a generated project's dependency state: the recorded digest must
 * match the lockfile actually present. Detects a tampered/regenerated lock and
 * an unlocked project claiming to be locked.
 */
export async function verifyProjectDependencies(projectDir) {
  const manifest = await readProjectManifest(projectDir);
  const issues = [];
  const locked = manifest.dependenciesLocked === true;
  const actualDigest = await computeLockDigest(projectDir);
  for (const runtimeLock of manifest.runtimeLocks ?? []) {
    if (typeof runtimeLock?.lockfile !== 'string'
      || runtimeLock.lockfile.startsWith('/')
      || runtimeLock.lockfile.includes('\\')
      || runtimeLock.lockfile.split('/').includes('..')) {
      issues.push('runtime lock path is invalid');
      continue;
    }
    if (!/^[a-f0-9]{64}$/.test(runtimeLock.lockDigest ?? '')) {
      issues.push(`runtime lock digest is invalid: ${runtimeLock.lockfile}`);
      continue;
    }
    const actual = await computeFileDigest(join(projectDir, runtimeLock.lockfile));
    if (!actual) issues.push(`runtime lock is missing: ${runtimeLock.lockfile}`);
    else if (actual !== runtimeLock.lockDigest) {
      issues.push(`${runtimeLock.lockfile} digest mismatch: recorded ${runtimeLock.lockDigest.slice(0, 12)}…, actual ${actual.slice(0, 12)}…`);
    }
  }

  if (!locked) {
    if (manifest.lockDigest) issues.push('dependenciesLocked is false but a lockDigest is recorded');
    return {
      valid: issues.length === 0,
      dependenciesLocked: false,
      recordedDigest: manifest.lockDigest ?? null,
      actualDigest,
      runtimeLocks: manifest.runtimeLocks ?? [],
      issues,
      note: 'Project generated without dependency finalization: run `enistere install <project>`.',
    };
  }

  if (!actualDigest) issues.push(`dependenciesLocked is true but ${PROJECT_LOCKFILE} is missing`);
  else if (!manifest.lockDigest) issues.push('dependenciesLocked is true but no lockDigest is recorded');
  else if (manifest.lockDigest !== actualDigest) {
    issues.push(`${PROJECT_LOCKFILE} digest mismatch: recorded ${manifest.lockDigest.slice(0, 12)}…, actual ${actualDigest.slice(0, 12)}…`);
  }

  return {
    valid: issues.length === 0,
    dependenciesLocked: true,
    recordedDigest: manifest.lockDigest ?? null,
    actualDigest,
    runtimeLocks: manifest.runtimeLocks ?? [],
    issues,
  };
}
