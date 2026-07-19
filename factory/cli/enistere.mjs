#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { assertBlueprint, createDefaultBlueprint, readBlueprint } from '../engine/blueprint.mjs';
import { buildGenerationPlan } from '../engine/plan.mjs';
import { generateProject } from '../engine/generator.mjs';
import { assessCapabilitySupport, buildCapabilityMatrix, loadCapabilityManifests } from '../engine/capabilities.mjs';
import { loadStarterManifests, modularStarterIds, selectedStarterIds, validateManifestConsistency } from '../engine/starters.mjs';
import { finalizeDependencies, verifyProjectDependencies } from '../engine/dependencies.mjs';

const FOUNDATION_ROOT = resolve(import.meta.dirname, '../..');

function help() {
  console.log([
    'Usage: enistere <doctor|init|plan|generate|install|verify> [arguments]',
    '',
    '  doctor                              environment and manifest matrix',
    '  init [path] [slug]                  write a default blueprint',
    '  plan <blueprint>                    print the generation plan',
    '  generate <blueprint> <out> [--install|--no-install]',
    '                                      generate a project; --install also locks',
    '                                      dependencies (npm lock without lifecycle',
    '                                      scripts, then npm ci). Default: --no-install.',
    '  install <project>                   finalize dependencies of a generated project',
    '  verify <blueprint|project>          a file verifies a blueprint; a directory',
    '                                      verifies a generated project (lock digest)',
  ].join('\n'));
}

function probe(command) {
  const result = spawnSync(command, ['--version'], { encoding: 'utf8', shell: false, timeout: 5000 });
  return { available: result.status === 0, version: result.status === 0 ? (result.stdout || result.stderr).trim().split('\n')[0] : null };
}

async function isDirectory(path) {
  try { return (await stat(path)).isDirectory(); } catch { return false; }
}

/** Splits argv into positional arguments and known flags. */
export function parseArguments(argv) {
  const positional = [];
  const flags = new Set();
  for (const item of argv) {
    if (item.startsWith('--')) flags.add(item);
    else positional.push(item);
  }
  return { positional, flags };
}

/** `--install` opts in to dependency finalization; `--no-install` is the default. */
export function wantsInstall(flags) {
  if (flags.has('--install') && flags.has('--no-install')) {
    throw new Error('generate accepts either --install or --no-install, not both');
  }
  return flags.has('--install');
}

async function main() {
  const { positional, flags } = parseArguments(process.argv.slice(2));
  const [command, first, second] = positional;

  if (command === 'doctor') {
    const starters = await loadStarterManifests(FOUNDATION_ROOT);
    const capabilities = await loadCapabilityManifests(FOUNDATION_ROOT);
    const consistencyIssues = validateManifestConsistency(starters, capabilities);
    console.log(JSON.stringify({
      node: process.version,
      git: probe('git'),
      npm: probe('npm'),
      agents: { codex: probe('codex'), claude: probe('claude'), gemini: probe('gemini') },
      capabilityMatrix: buildCapabilityMatrix(capabilities),
      manifestsConsistent: consistencyIssues.length === 0,
      consistencyIssues,
    }, null, 2));
    return;
  }

  if (command === 'init') {
    const target = resolve(first ?? 'enistere.yaml');
    await mkdir(resolve(target, '..'), { recursive: true });
    await writeFile(target, `${JSON.stringify(createDefaultBlueprint(second ?? 'enistere-app'), null, 2)}\n`, { flag: 'wx' });
    console.log(target);
    return;
  }

  if (command === 'install') {
    if (!first) throw new Error('install requires a generated project directory');
    const projectDir = resolve(first);
    if (!(await isDirectory(projectDir))) throw new Error(`Not a directory: ${projectDir}`);
    const dependencies = await finalizeDependencies(projectDir);
    console.log(JSON.stringify({ project: projectDir, ...dependencies }, null, 2));
    return;
  }

  // `verify <directory>` verifies a generated project's dependency state.
  if (command === 'verify' && first && (await isDirectory(resolve(first)))) {
    const projectDir = resolve(first);
    const result = await verifyProjectDependencies(projectDir);
    console.log(JSON.stringify({ project: projectDir, ...result }, null, 2));
    if (!result.valid) process.exitCode = 1;
    return;
  }

  if (['plan', 'generate', 'verify'].includes(command)) {
    if (!first) throw new Error(`${command} requires a blueprint path`);
    const blueprint = assertBlueprint(await readBlueprint(resolve(first)));
    const starters = await loadStarterManifests(FOUNDATION_ROOT);
    const plan = buildGenerationPlan(blueprint, { modularStarters: modularStarterIds(starters) });
    const capabilities = await loadCapabilityManifests(FOUNDATION_ROOT, blueprint.capabilities);
    const support = assessCapabilitySupport(selectedStarterIds(blueprint), capabilities);
    if (command === 'verify') {
      console.log(JSON.stringify({ valid: support.ready, project: blueprint.project.slug, capabilitySupport: support }, null, 2));
      if (!support.ready) process.exitCode = 1;
      return;
    }
    if (command === 'plan') { console.log(JSON.stringify({ ...plan, capabilitySupport: support }, null, 2)); return; }
    if (!second) throw new Error('generate requires an output directory');
    const output = resolve(second);
    await generateProject(blueprint, output);
    const install = wantsInstall(flags);
    const dependencies = install
      ? await finalizeDependencies(output)
      : { dependenciesLocked: false, lockfile: 'package-lock.json', lockDigest: null, lockfileVersion: null };
    console.log(JSON.stringify({ ...plan, output, ...dependencies }, null, 2));
    return;
  }

  help();
  if (command) process.exitCode = 1;
}

// Only run the CLI when invoked as a program (the helpers above are unit-tested).
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
