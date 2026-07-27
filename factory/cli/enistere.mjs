#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { assertBlueprint, createDefaultBlueprint, readBlueprint } from '../engine/blueprint.mjs';
import { buildGenerationPlan } from '../engine/plan.mjs';
import { generateProject } from '../engine/generator.mjs';
import { buildCapabilityMatrix, loadCapabilityManifests } from '../engine/capabilities.mjs';
import { assessProfile, getProfile, listProfiles, profileStarterIds } from '../engine/profiles.mjs';
import { loadStarterManifests, modularStarterIds, validateManifestConsistency } from '../engine/starters.mjs';
import { finalizeDependencies, verifyProjectDependencies } from '../engine/dependencies.mjs';
import { normalizeBlueprint } from '../blueprint/normalize.mjs';
import { validateCanonicalSystem } from '../blueprint/validate.mjs';
import { errors, formatDiagnostics, hasErrors } from '../model/diagnostics.mjs';
import {
  canonicalSystemProfile,
  SYSTEM_PROFILE_DEFINITIONS,
  SYSTEM_PROFILES,
  systemProfileDefaultArchitecture,
} from '../model/system-profiles.mjs';

const FOUNDATION_ROOT = resolve(import.meta.dirname, '../..');

function help() {
  console.log([
    'Usage: enistere <doctor|architecture|profiles|profile|init|validate|plan|generate|install|verify> [arguments]',
    '',
    '  doctor                              environment and manifest matrix',
    '  profiles                            historical composition presets',
    '  profile <name>                      detail one preset and its proof',
    '  architecture list                   list canonical system profiles',
    '  architecture describe <name>        describe one canonical system profile',
    '  architecture recommend [drivers]    recommend the least-distributed profile',
    '    drivers: --apis=N --clients=N --teams=N --independent-deployments',
    '             --isolated-data --polyglot',
    '  init [path] [slug] --architecture=PROFILE',
    '                                      write a system-first blueprint',
    '    topology: --api=RUNTIME[,RUNTIME] --web=RUNTIME[,RUNTIME]',
    '              --mobile=RUNTIME[,RUNTIME]',
    '  validate <blueprint>                validate representation independently',
    '                                      from generation support',
    '  plan <blueprint> [--explain]        print the generation plan or its',
    '                                      architecture decision',
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

function numericFlag(flags, name, fallback) {
  const prefix = `${name}=`;
  const match = [...flags].find((flag) => flag.startsWith(prefix));
  if (!match) return fallback;
  const value = Number.parseInt(match.slice(prefix.length), 10);
  if (!Number.isInteger(value) || value < 0) throw new Error(`${name} must be a non-negative integer`);
  return value;
}

function stringFlag(flags, name) {
  const prefix = `${name}=`;
  const match = [...flags].find((flag) => flag.startsWith(prefix));
  return match?.slice(prefix.length);
}

function runtimeListFlag(flags, name, fallback) {
  const value = stringFlag(flags, name);
  if (value === undefined) return [...fallback];
  if (value === '' || value === 'none') return [];
  return value.split(',').filter(Boolean);
}

function applicationsFor(kind, runtimes) {
  return runtimes.map((runtime, index) => ({
    id: runtimes.length === 1 ? kind : `${kind}-${index + 1}`,
    kind,
    runtime,
  }));
}

/**
 * Builds the initial blueprint from the system purpose first. This is the
 * non-interactive equivalent of the guided question; scripts must make the
 * architecture choice explicit instead of starting from a framework starter.
 */
export function createArchitectureBlueprint(slug, flags) {
  const requested = stringFlag(flags, '--architecture');
  const profile = canonicalSystemProfile(requested);
  if (!profile || !SYSTEM_PROFILES.includes(profile)) {
    throw new Error(`init requires --architecture=${SYSTEM_PROFILES.join('|')}`);
  }

  const defaultApis = ['distributed-platform', 'service-ecosystem'].includes(profile)
    ? ['spring', 'nestjs']
    : ['spring'];
  const defaultWeb = profile === 'product-platform' ? ['angular'] : [];
  const apis = runtimeListFlag(flags, '--api', defaultApis);
  const webs = runtimeListFlag(flags, '--web', defaultWeb);
  const mobiles = runtimeListFlag(flags, '--mobile', []);
  const apiIds = applicationsFor('api', apis).map((app) => app.id);
  const clients = [
    ...applicationsFor('web', webs),
    ...applicationsFor('mobile', mobiles),
  ].map((app) => ({ ...app, consumes: [...apiIds] }));

  const blueprint = createDefaultBlueprint(slug);
  delete blueprint.stack;
  blueprint.applications = [...applicationsFor('api', apis), ...clients];
  blueprint.architecture = { profile };
  assertBlueprint(blueprint);
  const diagnostics = validateCanonicalSystem(normalizeBlueprint(blueprint));
  if (hasErrors(diagnostics)) {
    throw new Error(`Invalid architecture selection:\n${formatDiagnostics(errors(diagnostics))}`);
  }
  return blueprint;
}

/** Deterministic, conservative profile recommendation from architecture drivers. */
export function recommendSystemProfile(flags) {
  const apis = numericFlag(flags, '--apis', 1);
  const clients = numericFlag(flags, '--clients', 0);
  const teams = numericFlag(flags, '--teams', 1);
  const autonomous = flags.has('--independent-deployments') && flags.has('--isolated-data') && teams > 1;
  let profile;
  let reason;
  if (autonomous) {
    profile = 'service-ecosystem';
    reason = 'independent deployments, isolated data and multiple autonomous teams';
  } else if (apis > 1 || flags.has('--polyglot')) {
    profile = 'distributed-platform';
    reason = apis > 1 ? 'multiple backend authorities' : 'different backend technologies';
  } else if (clients > 0) {
    profile = 'product-platform';
    reason = 'one product authority with official clients';
  } else {
    profile = 'backend-service';
    reason = 'a backend capability without an official client';
  }
  const architecture = systemProfileDefaultArchitecture(profile);
  architecture.clients.mode = clients === 0 ? 'none' : clients === 1 ? 'single' : 'multiple';
  return {
    profile,
    reason,
    architecture,
    drivers: {
      backendAuthorities: apis,
      officialClients: clients,
      autonomousTeams: teams,
      independentDeployments: flags.has('--independent-deployments'),
      isolatedData: flags.has('--isolated-data'),
      polyglot: flags.has('--polyglot'),
    },
  };
}

async function main() {
  const { positional, flags } = parseArguments(process.argv.slice(2));
  const [command, first, second] = positional;

  if (command === 'architecture') {
    if (first === 'list') {
      console.log(JSON.stringify({
        profiles: SYSTEM_PROFILES.map((id) => ({
          ...SYSTEM_PROFILE_DEFINITIONS[id],
          defaults: systemProfileDefaultArchitecture(id),
        })),
      }, null, 2));
      return;
    }
    if (first === 'describe') {
      if (!second || !SYSTEM_PROFILE_DEFINITIONS[second]) throw new Error('architecture describe requires a canonical system profile');
      console.log(JSON.stringify({
        ...SYSTEM_PROFILE_DEFINITIONS[second],
        defaults: systemProfileDefaultArchitecture(second),
      }, null, 2));
      return;
    }
    if (first === 'recommend') {
      const recommendation = recommendSystemProfile(flags);
      console.log(JSON.stringify({
        ...recommendation,
        support: SYSTEM_PROFILE_DEFINITIONS[recommendation.profile],
      }, null, 2));
      return;
    }
    throw new Error('architecture requires list, describe or recommend');
  }

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

  if (command === 'profiles') {
    const capabilities = await loadCapabilityManifests(FOUNDATION_ROOT);
    const starters = await loadStarterManifests(FOUNDATION_ROOT);
    console.log(JSON.stringify({
      profiles: listProfiles().map((entry) => {
        const assessment = assessProfile(entry, capabilities, starters);
        return {
          id: entry.id,
          status: entry.status,
          stack: entry.stack,
          capabilities: entry.capabilities,
          runtimeProven: Boolean(entry.golden),
          compositionExact: assessment.compositionExact,
          generatable: assessment.composable,
        };
      }),
    }, null, 2));
    return;
  }

  if (command === 'profile') {
    if (!first) throw new Error('profile requires a name');
    // Throws with the API-mandatory invariant for web-only and mobile-only names.
    const entry = getProfile(first);
    const capabilities = await loadCapabilityManifests(FOUNDATION_ROOT, entry.capabilities);
    const starters = await loadStarterManifests(FOUNDATION_ROOT);
    const assessment = assessProfile(entry, capabilities, starters);
    console.log(JSON.stringify({
      ...entry,
      starters: profileStarterIds(entry),
      runtimeProven: Boolean(entry.golden),
      generatable: assessment.composable,
      assessment,
    }, null, 2));
    if (!assessment.composable) process.exitCode = 1;
    return;
  }

  if (command === 'init') {
    const target = resolve(first ?? 'enistere.yaml');
    await mkdir(resolve(target, '..'), { recursive: true });
    const blueprint = createArchitectureBlueprint(second ?? 'enistere-app', flags);
    await writeFile(target, `${JSON.stringify(blueprint, null, 2)}\n`, { flag: 'wx' });
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

  if (['validate', 'plan', 'generate', 'verify'].includes(command)) {
    if (!first) throw new Error(`${command} requires a blueprint path`);
    const blueprint = assertBlueprint(await readBlueprint(resolve(first)));
    const canonicalSystem = normalizeBlueprint(blueprint);
    const representationDiagnostics = validateCanonicalSystem(canonicalSystem);
    if (command === 'validate') {
      const valid = !hasErrors(representationDiagnostics);
      console.log(JSON.stringify({
        valid,
        architecture: canonicalSystem.architecture,
        diagnostics: representationDiagnostics,
      }, null, 2));
      if (!valid) process.exitCode = 1;
      return;
    }
    const starters = await loadStarterManifests(FOUNDATION_ROOT);
    const capabilityManifests = await loadCapabilityManifests(FOUNDATION_ROOT, blueprint.capabilities);
    // The single canonical pipeline: blueprint → CSM → ResolvedSystem → plan.
    const plan = buildGenerationPlan(blueprint, { modularStarters: modularStarterIds(starters), starters, capabilityManifests });
    const generatable = plan.support.level === 'ready' && !hasErrors(plan.diagnostics);
    if (command === 'verify') {
      console.log(JSON.stringify({ valid: generatable, project: plan.project, support: plan.support, diagnostics: plan.diagnostics }, null, 2));
      if (!generatable) process.exitCode = 1;
      return;
    }
    if (command === 'plan') {
      if (flags.has('--explain')) {
        console.log(JSON.stringify({
          project: plan.project,
          architecture: plan.architecture,
          architectureProfile: plan.architectureProfile,
          compositionPreset: plan.compositionPreset,
          support: plan.support,
          diagnostics: plan.diagnostics,
        }, null, 2));
      } else {
        console.log(JSON.stringify({ ...plan, canonicalSystem }, null, 2));
      }
      return;
    }
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
