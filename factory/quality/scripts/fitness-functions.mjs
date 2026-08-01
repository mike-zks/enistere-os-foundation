#!/usr/bin/env node
/**
 * fitness-functions.mjs — Factory Quality : gouvernance exécutable (Contrat 5 du socle).
 *
 * Architecture fitness functions: cross-registry invariants that keep the socle
 * honest for good. They run over the REAL registries (topologies, target
 * adapters, capability and starter manifests, profiles) and fail if any
 * structural promise is broken. Generalizes the checks previously scattered
 * across the test suite into one runnable gate.
 *
 * Usage: node factory/quality/scripts/fitness-functions.mjs
 * Exits non-zero with a JSON report when a fitness function fails.
 *
 * Aucune dépendance externe. Compatible Node 24.
 */

import { resolve, dirname, join, posix } from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { loadStarterManifests, validateManifestConsistency, STARTER_IDS } from '../../engine/starters.mjs';
import {
  loadCapabilityManifests,
  validateCapabilityRegistry,
} from '../../engine/capabilities.mjs';
import { getTargetAdapter } from '../../engine/target-adapters.mjs';
import { APPLICATION_KINDS, GENERATABLE_KINDS, MANDATORY_KIND, isGeneratableKind } from '../../engine/topologies.mjs';
import { validateProfileRegistry } from '../../engine/profiles.mjs';

/** Declared, dated exceptions to FF5d. Absent file means no exception at all. */
function loadLayoutGaps(repoRoot) {
  const path = join(repoRoot, 'factory/quality/layout-gaps.json');
  if (!existsSync(path)) return new Map();
  const document = JSON.parse(readFileSync(path, 'utf8'));
  return new Map((document.gaps ?? []).map((gap) => [
    `${gap.capability}/${gap.runtime}`,
    { destinations: gap.destinations ?? [], deadline: gap.deadline ?? '1970-01-01' },
  ]));
}

/** Every overlay manifest in the registry, as `[capability, target, manifest]`. */
function overlayManifests(repoRoot) {
  const found = [];
  const capabilitiesDir = join(repoRoot, 'capabilities');
  if (!existsSync(capabilitiesDir)) return found;
  for (const capability of readdirSync(capabilitiesDir, { withFileTypes: true })) {
    if (!capability.isDirectory()) continue;
    const targetsDir = join(capabilitiesDir, capability.name, 'targets');
    if (!existsSync(targetsDir)) continue;
    for (const target of readdirSync(targetsDir, { withFileTypes: true })) {
      if (!target.isDirectory()) continue;
      const manifest = join(targetsDir, target.name, 'overlay.json');
      if (!existsSync(manifest)) continue;
      found.push([capability.name, target.name, JSON.parse(readFileSync(manifest, 'utf8'))]);
    }
  }
  return found;
}

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

/**
 * The zones of each runtime, read by FF5d (where a capability may write) and
 * FF5e (what the Factory's own code may import). One map, so the frontier
 * cannot be enforced in one direction and forgotten in the other.
 *
 * A `core` entry ending in `/` is a directory; anything else is a file prefix,
 * for the root modules a framework insists on keeping beside its packages.
 *
 * `routes` is the framework routing root of the file-based routers — `src/app/`
 * on Next.js, `app/` on Expo. It is deliberately **not** core: capabilities
 * write pages there, so FF5d must not forbid them. But every file a starter
 * ships there is Factory-owned and replaced by a regeneration, so FF5e reads it
 * exactly like the core. The other five runtimes route in code, not in a
 * directory, and their router already sits in the core zone.
 */
export const RUNTIME_ZONES = {
  angular: {
    core: ['src/app/core/', 'src/app/pages/', 'src/app/shared/', 'src/app/app.'],
    business: 'src/app/features/',
  },
  flutter: {
    core: ['lib/src/core/', 'lib/src/theme/', 'lib/main.dart', 'lib/app.dart'],
    business: 'lib/src/features/',
  },
  nextjs: {
    core: ['src/core/', 'src/shared/', 'src/types/'],
    routes: ['src/app/'],
    business: 'src/features/',
  },
  // NestJS has no single `core/` directory: its core zone is every top-level
  // source directory the starter owns. Listing them is the honest encoding —
  // the alternative would be to invent a `core/` the framework never had.
  nestjs: {
    core: ['src/audit/', 'src/bootstrap/', 'src/common/', 'src/composition/', 'src/config/',
      'src/database/', 'src/health/', 'src/platform/', 'src/app.module.ts', 'src/main.ts'],
    business: 'src/modules/',
  },
  // `app/persistence/` is measured like any other core directory since the
  // baseline owns it (ADR-080). The blind spot the rule used to carry — a
  // capability contributing core infrastructure — no longer exists on any
  // runtime.
  fastapi: {
    core: ['app/composition/', 'app/persistence/', 'app/config.py', 'app/main.py',
      'app/platform.py'],
    business: 'app/modules/',
  },
  // React Native's core zone is the set of directories the starter owns. The
  // secure-storage port, the form foundation and the query client stay there
  // even though Authentication ships them: they name no domain.
  'react-native': {
    core: ['src/a11y/', 'src/analytics/', 'src/api/', 'src/app-environment/',
      'src/app-lifecycle/', 'src/biometrics/', 'src/clipboard/', 'src/composition/',
      'src/config/', 'src/consent/', 'src/crash-reporting/', 'src/i18n/', 'src/linking/',
      'src/logger/', 'src/offline/', 'src/permissions/', 'src/platform/', 'src/preferences/',
      'src/push/', 'src/query/', 'src/retry/', 'src/session/', 'src/states/', 'src/store/',
      'src/telemetry/', 'src/theme/', 'src/types/', 'src/ui/'],
    routes: ['app/'],
    business: 'src/features/',
  },
  spring: {
    core: ['src/main/java/com/enistere/core/common/', 'src/main/java/com/enistere/core/config/',
      'src/main/java/com/enistere/core/health/', 'src/main/java/com/enistere/core/platform/',
      'src/main/java/com/enistere/core/infrastructure/',
      'src/test/java/com/enistere/core/infrastructure/',
      'src/main/java/com/enistere/core/EnistereCoreApplication.java'],
    business: 'src/main/java/com/enistere/core/modules/',
  },
};

/** Path aliases a runtime resolves to its source root, longest prefix first. */
const SOURCE_ALIASES = {
  nextjs: [['@/', 'src/']],
  'react-native': [['@/', 'src/']],
  flutter: [['package:mobile_flutter/', 'lib/']],
};

/** Source extensions FF5e knows how to read imports from. */
const READABLE_SOURCE = /\.(ts|tsx|js|jsx|mjs|dart|py|java)$/;

/**
 * Every module specifier a source file imports or re-exports. Regex-level on
 * purpose: a parser per language would be five dependencies to state one fact.
 */
export function sourceSpecifiers(relativePath, source) {
  const found = [];
  const scan = (pattern) => {
    let match;
    while ((match = pattern.exec(source)) !== null) found.push(match[1]);
  };
  if (/\.(ts|tsx|js|jsx|mjs)$/.test(relativePath)) {
    scan(/(?:from|import|require)\s*\(?\s*['"]([^'"]+)['"]/g);
  } else if (relativePath.endsWith('.dart')) {
    scan(/(?:import|export)\s+['"]([^'"]+)['"]/g);
  } else if (relativePath.endsWith('.py')) {
    scan(/^\s*from\s+([.\w]+)\s+import\s/gm);
    scan(/^\s*import\s+([.\w]+)/gm);
  } else if (relativePath.endsWith('.java')) {
    scan(/^\s*import\s+(?:static\s+)?([\w.]+)\s*;/gm);
  }
  return found;
}

/**
 * The starter-relative path a specifier points at, or `null` when it leaves the
 * project — a package name resolves to `node_modules`, not to a zone.
 */
export function resolveSpecifier(runtime, relativePath, specifier) {
  if (relativePath.endsWith('.java')) {
    return `src/main/java/${specifier.split('.').join('/')}`;
  }
  if (relativePath.endsWith('.py')) {
    if (!specifier.startsWith('.')) return specifier.split('.').join('/');
    // `from ..x import y` climbs one package per dot beyond the first.
    const climb = specifier.match(/^\.+/)[0].length;
    const base = posix.dirname(relativePath).split('/');
    const kept = climb > 1 ? base.slice(0, -(climb - 1)) : base;
    return [...kept, ...specifier.slice(climb).split('.').filter(Boolean)].join('/');
  }
  if (specifier.startsWith('.')) {
    return posix.normalize(posix.join(posix.dirname(relativePath), specifier));
  }
  for (const [alias, root] of SOURCE_ALIASES[runtime] ?? []) {
    if (specifier.startsWith(alias)) return `${root}${specifier.slice(alias.length)}`;
  }
  return null;
}

/**
 * Reads every source file a starter owns and a regeneration replaces — the core
 * zone plus the routing root — as `[runtime, path, source]`.
 *
 * Reading the routing root from the *starter* is what makes the distinction
 * work without a rule of its own: a capability's own pages never appear here,
 * because a starter ships none.
 */
export function factoryOwnedSources(repoRoot = REPO_ROOT) {
  const collected = [];
  const walk = (runtime, absolute, relative) => {
    if (!existsSync(absolute)) return;
    for (const entry of readdirSync(absolute, { withFileTypes: true })) {
      const child = join(absolute, entry.name);
      const childRelative = `${relative}/${entry.name}`;
      if (entry.isDirectory()) walk(runtime, child, childRelative);
      else if (READABLE_SOURCE.test(entry.name)) {
        collected.push([runtime, childRelative, readFileSync(child, 'utf8')]);
      }
    }
  };
  for (const [runtime, zone] of Object.entries(RUNTIME_ZONES)) {
    const starter = join(repoRoot, 'starters', runtime);
    if (!existsSync(starter)) continue;
    for (const prefix of [...zone.core, ...(zone.routes ?? [])]) {
      if (prefix.endsWith('/')) {
        walk(runtime, join(starter, prefix), prefix.replace(/\/$/, ''));
        continue;
      }
      // A file prefix: the root modules that sit beside the packages.
      const directory = posix.dirname(prefix);
      const absolute = join(starter, directory);
      if (!existsSync(absolute)) continue;
      for (const entry of readdirSync(absolute, { withFileTypes: true })) {
        const relative = posix.join(directory, entry.name);
        if (!entry.isFile() || !relative.startsWith(prefix)) continue;
        if (!READABLE_SOURCE.test(entry.name)) continue;
        collected.push([runtime, relative, readFileSync(join(absolute, entry.name), 'utf8')]);
      }
    }
  }
  return collected;
}

/** The generated composition files, which exist precisely to import business code. */
function compositionSeams() {
  const seams = new Set();
  for (const runtime of Object.keys(RUNTIME_ZONES)) {
    for (const seam of getTargetAdapter(runtime)?.composition ?? []) {
      seams.add(`${runtime}/${seam.destination}`);
    }
  }
  return seams;
}

/**
 * Runs the fitness functions against the given registries. Returns
 * `{ passed, findings }`; each finding is `{ rule, detail }`.
 */
export function runFitnessFunctions({
  starters,
  capabilities,
  repoRoot = REPO_ROOT,
  pathExists = existsSync,
  // Injectable so the zone rule can be exercised in both directions without
  // writing a broken overlay into the repository to test it.
  overlays = overlayManifests(repoRoot),
  layoutGaps = loadLayoutGaps(repoRoot),
  coreSources = factoryOwnedSources(repoRoot),
}) {
  const findings = [];
  const fail = (rule, detail) => findings.push({ rule, detail });

  // FF1 — the API invariant is enforceable: the mandatory kind is generatable.
  if (!isGeneratableKind(MANDATORY_KIND)) fail('api-invariant', `${MANDATORY_KIND} must be a generatable kind`);

  // FF2 — every generatable kind's runtimes are backed by a registered adapter,
  // and every adapter runtime is a known starter (no orphan target).
  for (const kind of GENERATABLE_KINDS) {
    for (const runtime of APPLICATION_KINDS[kind].runtimes) {
      if (!STARTER_IDS.includes(runtime)) fail('kind-runtime-coverage', `kind ${kind} runtime ${runtime} is not a registered starter`);
      if (!getTargetAdapter(runtime)) fail('kind-adapter-coverage', `kind ${kind} runtime ${runtime} has no target adapter`);
    }
  }

  // FF3 — Capability Manifest v2 is the only dependency-policy source. Registry
  // validation covers closure, cycles, symmetric explained conflicts and target
  // adapter compatibility.
  for (const issue of validateCapabilityRegistry(capabilities)) {
    const rule = issue.includes('both requires and conflicts')
      ? 'capability-contradiction'
      : issue.includes('conflict') && issue.includes('symmetric')
        ? 'capability-conflict-symmetry'
        : 'capability-closure';
    fail(rule, issue);
  }

  // FF4 — starter and capability manifests agree on per-target support.
  for (const issue of validateManifestConsistency(starters, capabilities)) fail('manifest-consistency', issue);

  // FF5 — the profile registry is truthful: no `ready` without a golden and an
  // exact composition, no status the real matrix does not support.
  for (const issue of validateProfileRegistry(capabilities, starters)) fail('profile-truthfulness', issue);

  // FF5b — single source per runtime: every starter is materialized directly at
  // `starters/<runtime>`. The former `baseSource` escape hatch and `base/`
  // subfolders are forbidden; otherwise the repository would again carry two
  // competing representations of the same runtime.
  for (const starter of starters) {
    if (starter.composition?.baseSource) {
      fail('single-source', `starter ${starter.id} declares forbidden composition.baseSource`);
    }
    if (pathExists(join(repoRoot, 'starters', starter.id, 'base'))) {
      fail('single-source', `starter ${starter.id} carries a forbidden base/ subfolder`);
    }
  }

  // FF5c — a runtime baseline exposes neutral hooks, never an optional
  // capability implementation. These exact source roots are reserved for
  // overlays after materialization.
  const forbiddenCapabilityRoots = {
    'react-native': [
      // Both the old flat location and the business zone: a starter must embed a
      // capability at neither.
      'src/auth',
      'src/upload',
      'src/notifications',
      'src/features/auth',
      'src/features/upload',
      'src/features/notifications',
      'app/(public)',
      'app/(app)',
    ],
    flutter: [
      'lib/src/auth',
      'lib/src/core/auth',
      'lib/src/core/upload',
      'lib/src/core/notifications',
      'lib/src/features/auth',
      'lib/src/features/upload',
      'lib/src/features/notifications',
    ],
    angular: [
      'src/app/core/auth',
      'src/app/core/upload',
      'src/app/core/notifications',
      'src/app/features',
    ],
  };
  for (const [runtime, roots] of Object.entries(forbiddenCapabilityRoots)) {
    for (const relative of roots) {
      if (pathExists(join(repoRoot, 'starters', runtime, relative))) {
        fail('capability-free-runtime', `starter ${runtime} embeds forbidden capability source ${relative}`);
      }
    }
  }

  // FF5d — a capability is business code and belongs in the business zone of the
  // runtime it targets, never inside the zone the Factory owns and replaces.
  const businessZone = RUNTIME_ZONES;
  const declaredLayoutGaps = layoutGaps;
  const today = new Date().toISOString().slice(0, 10);
  for (const [capability, target, overlay] of overlays) {
    const zone = businessZone[target];
    if (!zone) continue;
    const declared = declaredLayoutGaps.get(`${capability}/${target}`);
    for (const entry of overlay.files ?? []) {
      const destination = entry.destination ?? '';
      const cores = Array.isArray(zone.core) ? zone.core : [zone.core];
      // `startsWith(prefix)` alone lets an overlay that writes a whole core
      // directory through: `src/api` does not start with `src/api/`. Replacing
      // the directory wholesale is the *larger* breach, not an exemption.
      const breached = cores.find(
        (prefix) => destination.startsWith(prefix) || destination === prefix.replace(/\/$/, ''),
      );
      if (breached === undefined) continue;
      if (!declared?.destinations.includes(destination)) {
        fail(
          'capability-business-zone',
          `${capability}/${target} writes ${destination} into the core zone (${breached})`,
        );
      } else if (declared.deadline < today) {
        fail(
          'capability-business-zone',
          `${capability}/${target} layout gap expired on ${declared.deadline} (${destination})`,
        );
      }
    }
  }
  // A declaration nobody violates is stale: it would quietly authorise a
  // regression that has already been fixed.
  for (const [key, gap] of declaredLayoutGaps) {
    const [capability, target] = key.split('/');
    const zone = businessZone[target];
    const written = new Set(
      overlays
        .filter(([id, runtime]) => id === capability && runtime === target)
        .flatMap(([, , overlay]) => (overlay.files ?? []).map((entry) => entry.destination)),
    );
    for (const destination of gap.destinations) {
      if (!zone || !written.has(destination)) {
        fail('capability-business-zone', `${key} declares a layout gap that no longer exists: ${destination}`);
      }
    }
  }

  // FF5e — the complement FF5d cannot express. FF5d measures where a file
  // lands; it says nothing about what that file imports. A regeneration may
  // replace what the Factory owns because no capability writes into it — but it
  // only really may if none of it depends on what a capability delivered.
  //
  // The business zone is the zone regeneration never touches: whatever lives
  // there belongs to whoever received the project. A Factory-owned file
  // importing it depends on code the Factory neither ships nor maintains.
  const seams = compositionSeams();
  for (const [runtime, relativePath, source] of coreSources) {
    const zone = RUNTIME_ZONES[runtime];
    if (!zone) continue;
    // The composition files are the sanctioned exception, and they are read
    // from the adapter registry rather than listed here: the seam is exactly
    // what the Factory generates, so the exemption cannot drift from it.
    if (seams.has(`${runtime}/${relativePath}`)) continue;
    for (const specifier of sourceSpecifiers(relativePath, source)) {
      const target = resolveSpecifier(runtime, relativePath, specifier);
      if (target === null || !target.startsWith(zone.business)) continue;
      fail(
        'core-business-independence',
        `${runtime} starter file ${relativePath} imports the business zone (${specifier})`,
      );
    }
  }

  return { passed: findings.length === 0, findings };
}

// ── Pipeline fitness functions over the SOURCE (ADR-046, ADR-047 FF6+). ──────
// FF1–FF5 keep the registries honest; FF6–FF8 keep the single canonical pipeline
// honest, so the ADR-046 boundary cannot silently regress.

/** Modules downstream of ingestion that must NEVER import the blueprint layer. */
const DOWNSTREAM_PURE_MODULES = [
  'factory/engine/resolver.mjs',
  'factory/model/resolved-system.mjs',
  'factory/model/generation-plan.mjs',
  'factory/model/canonical-system.mjs',
];

/** Ingestion symbols a downstream module must not import (frontier-only). */
const FORBIDDEN_INGESTION_IMPORTS = [
  'normalizeBlueprint', 'resolveApplications', 'resolveStack',
  'readBlueprint', 'assertBlueprint', 'createDefaultBlueprint',
];

/** The single canonical chain `buildGenerationPlan` must wire, in order. */
const CANONICAL_CHAIN = ['normalizeBlueprint', 'validateCanonicalSystem', 'resolveSystem', 'buildPlan'];

/** The single-definition canonical model factories (no competing internal model). */
const MODEL_FACTORIES = ['canonicalSystem', 'resolvedSystem', 'buildPlan'];

/** Parses the static imports of an ES module source into `{ names, from }`. */
export function staticImports(source) {
  const imports = [];
  const re = /import\s+(?:([A-Za-z0-9_$]+)\s*,?\s*)?(?:\{([^}]*)\})?\s*from\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = re.exec(source)) !== null) {
    const names = [];
    if (match[1]) names.push(match[1]);
    if (match[2]) for (const part of match[2].split(',')) {
      const name = part.trim().split(/\s+as\s+/)[0].trim();
      if (name) names.push(name);
    }
    imports.push({ names, from: match[3] });
  }
  return imports;
}

/** FF6 helper: findings if `source` (module `rel`) imports the ingestion layer. */
export function ingestionBoundaryFindings(rel, source) {
  const findings = [];
  for (const imp of staticImports(source)) {
    if (/blueprint/.test(imp.from)) findings.push({ rule: 'ingestion-boundary', detail: `${rel} imports the ingestion layer (${imp.from})` });
    for (const name of imp.names) {
      if (FORBIDDEN_INGESTION_IMPORTS.includes(name)) findings.push({ rule: 'ingestion-boundary', detail: `${rel} imports ingestion symbol ${name} (${imp.from})` });
    }
  }
  return findings;
}

/** Recursively collects non-test `.mjs` files under a directory. */
function collectModules(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'test') out.push(...collectModules(full)); }
    else if (entry.name.endsWith('.mjs') && !entry.name.endsWith('.test.mjs')) out.push(full);
  }
  return out;
}

/**
 * Runs the pipeline fitness functions over the real source (ADR-046). Returns
 * `{ passed, findings }`; each finding is `{ rule, detail }`.
 */
export function runPipelineFitnessFunctions({ repoRoot = REPO_ROOT } = {}) {
  const findings = [];
  const fail = (rule, detail) => findings.push({ rule, detail });
  const read = (rel) => readFileSync(resolve(repoRoot, rel), 'utf8');

  // FF6 — ingestion boundary: the blueprint is read only at the frontier
  // (normalize); no resolution/planning/model module imports the ingestion layer.
  for (const rel of DOWNSTREAM_PURE_MODULES) findings.push(...ingestionBoundaryFindings(rel, read(rel)));

  // FF7 — single internal representation: each canonical model factory is defined
  // exactly once across the engine and model layers (no competing internal model).
  const modules = [
    ...collectModules(resolve(repoRoot, 'factory/engine')),
    ...collectModules(resolve(repoRoot, 'factory/model')),
  ].map((file) => readFileSync(file, 'utf8'));
  for (const factory of MODEL_FACTORIES) {
    const count = modules.filter((source) => new RegExp(`export function ${factory}\\b`).test(source)).length;
    if (count !== 1) fail('single-internal-model', `${factory} must be defined exactly once, found ${count}`);
  }

  // FF8 — single canonical chain: the composition entry wires normalize →
  // validate → resolve → plan (no parallel orchestration).
  const planImports = staticImports(read('factory/engine/plan.mjs')).flatMap((imp) => imp.names);
  for (const link of CANONICAL_CHAIN) {
    if (!planImports.includes(link)) fail('canonical-chain', `plan.mjs (buildGenerationPlan) does not wire ${link}`);
  }

  return { passed: findings.length === 0, findings };
}

async function main() {
  const starters = await loadStarterManifests(REPO_ROOT);
  const capabilities = await loadCapabilityManifests(REPO_ROOT);
  const registry = runFitnessFunctions({ starters, capabilities });
  const pipeline = runPipelineFitnessFunctions({ repoRoot: REPO_ROOT });
  const report = { passed: registry.passed && pipeline.passed, findings: [...registry.findings, ...pipeline.findings] };
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
