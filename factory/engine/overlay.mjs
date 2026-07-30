import { access, cp, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, normalize, sep } from 'node:path';
import { CAPABILITY_IDS } from './capabilities.mjs';
import { STARTER_IDS } from './starters.mjs';
import {
  renderEnvironmentSection,
  renderPrismaCompositionBanner,
} from './overlay-renderers.mjs';
import { validateOverwriteUsage } from './overwrite-policy.mjs';
import { getTargetAdapter, integrationKindsFor } from './target-adapters.mjs';
import { buildDomainContribution } from './domain.mjs';
import {
  applyPrismaFragment,
  createPrismaComposition,
  isEmptyPrismaComposition,
  renderPrismaComposition,
} from './prisma-schema.mjs';

const SEMVER = /^\d+\.\d+\.\d+$/;
const ENV_NAME = /^[A-Z][A-Z0-9_]*$/;

/**
 * Known integration kinds, per target. An overlay requesting anything else is
 * rejected: the engine is the only interpreter of overlay operations and only
 * renders integrations it fully understands (no scripts, no hooks, no patches).
 */
export const INTEGRATION_KINDS = Object.freeze(Object.fromEntries(
  ['nestjs', 'nextjs', 'react-native', 'spring', 'fastapi', 'angular', 'flutter']
    .map((id) => [id, integrationKindsFor(id) ?? {}]),
));

function isSafeRelativePath(value) {
  if (typeof value !== 'string' || value === '' || value.startsWith('/') || value.includes('\\')) return false;
  if (value.split('/').includes('..')) return false;
  const parts = normalize(value).split(sep);
  return !parts.includes('..') && parts[0] !== '';
}

export function validateOverlayManifest(value, { capability, target } = {}) {
  const issues = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ['overlay must be an object'];
  const allowedKeys = new Set(['schemaVersion', 'capability', 'target', 'version', 'description', 'operations', 'files', 'dependencies', 'environment', 'integrations', 'verification', 'contract']);
  for (const key of Object.keys(value)) if (!allowedKeys.has(key)) issues.push(`unknown property: ${key}`);
  if (value.schemaVersion !== '1') issues.push('schemaVersion must be "1"');
  if (!CAPABILITY_IDS.includes(value.capability)) issues.push('capability is not registered');
  if (!STARTER_IDS.includes(value.target)) issues.push('target is not registered');
  if (capability && value.capability !== capability) issues.push(`capability must be ${capability}`);
  if (target && value.target !== target) issues.push(`target must be ${target}`);
  if (!SEMVER.test(value.version ?? '')) issues.push('version must use SemVer');

  if (!Array.isArray(value.files)) issues.push('files must be an array');
  else value.files.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') { issues.push(`files[${index}] must be an object`); return; }
    for (const key of Object.keys(entry)) if (!['source', 'destination', 'overwrite'].includes(key)) issues.push(`files[${index}].${key} is not a known operation`);
    if (!isSafeRelativePath(entry.source ?? '') || !(entry.source ?? '').startsWith('files/')) issues.push(`files[${index}].source must be a relative path under files/`);
    if (!isSafeRelativePath(entry.destination ?? '')) issues.push(`files[${index}].destination must be a safe relative path`);
    if (entry.overwrite !== undefined && typeof entry.overwrite !== 'boolean') issues.push(`files[${index}].overwrite must be a boolean`);
  });
  // Governed central files must be composed, never replaced (overwrite policy).
  if (Array.isArray(value.files)) issues.push(...validateOverwriteUsage(value.files));

  const adapter = getTargetAdapter(value.target);
  if (!value.dependencies || typeof value.dependencies !== 'object' || Array.isArray(value.dependencies)) issues.push('dependencies must be an object');
  else {
    const dependencyManager = adapter?.dependencyManager ?? 'npm';
    const allowedDependencyKeys = dependencyManager === 'maven'
      ? ['maven']
      : dependencyManager === 'python'
        ? ['python']
        : ['dependencies', 'devDependencies'];
    for (const key of Object.keys(value.dependencies)) if (!allowedDependencyKeys.includes(key)) issues.push(`dependencies.${key} is not supported for ${dependencyManager}`);
    if (dependencyManager === 'python' && value.dependencies.python !== undefined) {
      issues.push(...validatePythonDependencies(value.dependencies.python));
    }
    if (dependencyManager === 'maven') {
      const entries = value.dependencies.maven;
      if (!Array.isArray(entries)) issues.push('dependencies.maven must be an array for maven targets');
      else entries.forEach((entry, index) => {
        if (!entry || typeof entry !== 'object' || typeof entry.groupId !== 'string' || typeof entry.artifactId !== 'string') {
          issues.push(`dependencies.maven[${index}] requires groupId and artifactId`);
        }
        if (entry?.version !== undefined && typeof entry.version !== 'string') issues.push(`dependencies.maven[${index}].version must be a string`);
        if (entry?.scope !== undefined && !['compile', 'runtime', 'test', 'provided'].includes(entry.scope)) issues.push(`dependencies.maven[${index}].scope is invalid`);
      });
    }
    for (const section of ['dependencies', 'devDependencies']) {
      const block = value.dependencies[section];
      if (block === undefined) continue;
      if (!block || typeof block !== 'object' || Array.isArray(block)) { issues.push(`dependencies.${section} must be an object`); continue; }
      for (const [name, spec] of Object.entries(block)) {
        if (typeof spec !== 'string' || spec === '') issues.push(`dependencies.${section}.${name} must be a version range`);
        if (spec.startsWith('file:') || spec.startsWith('link:')) issues.push(`dependencies.${section}.${name} must not use local paths`);
      }
    }
  }

  if (!Array.isArray(value.environment)) issues.push('environment must be an array');
  else value.environment.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') { issues.push(`environment[${index}] must be an object`); return; }
    if (!ENV_NAME.test(entry.name ?? '')) issues.push(`environment[${index}].name is invalid`);
    if (typeof entry.example !== 'string') issues.push(`environment[${index}].example is required`);
  });

  if (!adapter) issues.push(`target adapter is not registered: ${value.target}`);
  if (value.operations !== undefined) {
    if (!Array.isArray(value.operations) || value.operations.length === 0 || value.operations.some((operation) => typeof operation !== 'string' || operation === '')) {
      issues.push('operations must be a non-empty array of strings');
    } else if (new Set(value.operations).size !== value.operations.length) {
      issues.push('operations must not contain duplicates');
    } else if (adapter && value.operations.some((operation) => !adapter.operations.includes(operation))) {
      const unsupported = value.operations.filter((operation) => !adapter.operations.includes(operation));
      issues.push(`unsupported operations for ${value.target}: ${unsupported.join(', ')}`);
    }
  }
  const knownKinds = adapter?.integrationKinds ?? {};
  if (!Array.isArray(value.integrations)) issues.push('integrations must be an array');
  else value.integrations.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') { issues.push(`integrations[${index}] must be an object`); return; }
    const fields = knownKinds[entry.kind];
    if (!fields) { issues.push(`integrations[${index}].kind is unknown for ${value.target}: ${entry.kind}`); return; }
    for (const key of Object.keys(entry)) {
      if (key !== 'kind' && !(key in fields)) issues.push(`integrations[${index}].${key} is not a known field of ${entry.kind}`);
    }
    for (const [field, type] of Object.entries(fields)) {
      const item = entry[field];
      const valid = type === 'integer'
        ? Number.isInteger(item) && item >= 0
        : typeof item === 'string' && item !== '';
      if (!valid) issues.push(`integrations[${index}].${field} is required for ${entry.kind} (${type})`);
    }
    if (entry.kind === 'nestjs.prisma-schema' && !isSafeRelativePath(entry.source ?? '')) issues.push(`integrations[${index}].source must be a safe relative path`);
  });

  // Optional published-contract expectations, verified against the OpenAPI actually
  // generated from the composed application (no snapshot is ever copied).
  if (value.contract !== undefined) {
    if (!value.contract || typeof value.contract !== 'object' || Array.isArray(value.contract)) {
      issues.push('contract must be an object');
    } else {
      for (const key of Object.keys(value.contract)) {
        if (key !== 'openapiOperations') issues.push(`contract.${key} is not supported`);
      }
      const operations = value.contract.openapiOperations;
      if (operations !== undefined && (!Array.isArray(operations) || operations.some((op) => typeof op !== 'string' || op === ''))) {
        issues.push('contract.openapiOperations must be an array of operationIds');
      } else if (operations !== undefined && new Set(operations).size !== operations.length) {
        issues.push('contract.openapiOperations must not contain duplicates');
      } else if (operations !== undefined && value.target !== 'nestjs') {
        issues.push('contract.openapiOperations is supported only for the nestjs target');
      }
    }
  }

  if (!Array.isArray(value.verification)) issues.push('verification must be an array');
  else value.verification.forEach((argv, index) => {
    if (!Array.isArray(argv) || argv.length === 0 || argv.some((part) => typeof part !== 'string' || part === '')) {
      issues.push(`verification[${index}] must be a non-empty argv array of strings`);
    }
  });

  return issues;
}

export function overlayDirectory(repoRoot, capability, target) {
  return join(repoRoot, 'capabilities', capability, 'targets', target);
}

export async function loadOverlay(repoRoot, capability, target) {
  const directory = overlayDirectory(repoRoot, capability, target);
  const manifestPath = join(directory, 'overlay.json');
  let source;
  try {
    source = await readFile(manifestPath, 'utf8');
  } catch {
    throw new Error(`Missing overlay manifest for ${capability} on ${target}: ${manifestPath}`);
  }
  const manifest = JSON.parse(source);
  const issues = validateOverlayManifest(manifest, { capability, target });
  if (issues.length) throw new Error(`${capability}/${target} overlay invalid:\n- ${issues.join('\n- ')}`);
  return { manifest, directory };
}

async function listFilesRecursive(root, prefix = '') {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...(await listFilesRecursive(join(root, entry.name), relative)));
    else files.push(relative);
  }
  return files;
}

/** Deterministic digest over the overlay manifest and its full payload tree. */
export async function computeOverlayDigest(overlay) {
  const hash = createHash('sha256');
  hash.update(JSON.stringify(overlay.manifest));
  for (const relative of await listFilesRecursive(overlay.directory)) {
    if (relative === 'overlay.json') continue;
    hash.update(`\n${relative}\n`);
    hash.update(await readFile(join(overlay.directory, relative)));
  }
  return hash.digest('hex');
}

async function exists(path) {
  try { await access(path, constants.F_OK); return true; } catch { return false; }
}

async function copyOverlayEntry(overlay, entry, appDirectory) {
  const source = join(overlay.directory, entry.source);
  let sourceStat;
  try {
    sourceStat = await stat(source);
  } catch {
    throw new Error(`${overlay.manifest.capability}/${overlay.manifest.target}: missing overlay payload ${entry.source}`);
  }
  const destination = join(appDirectory, entry.destination);
  if (sourceStat.isDirectory()) {
    if (entry.overwrite) throw new Error(`${overlay.manifest.capability}/${overlay.manifest.target}: overwrite is only allowed on file entries (${entry.destination})`);
    for (const relative of await listFilesRecursive(source)) {
      if (await exists(join(destination, relative))) {
        throw new Error(`${overlay.manifest.capability}/${overlay.manifest.target}: undeclared file conflict at ${entry.destination}/${relative}`);
      }
    }
  } else if ((await exists(destination)) && entry.overwrite !== true) {
    throw new Error(`${overlay.manifest.capability}/${overlay.manifest.target}: undeclared file conflict at ${entry.destination}`);
  }
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true, force: true });
}

/** `name==version` exactly: a lock holds pins, never ranges. */
const PYTHON_PIN = /^[A-Za-z0-9][A-Za-z0-9._-]*==[A-Za-z0-9][A-Za-z0-9.*+!-]*$/;

/**
 * Validates the python dependency block of an overlay.
 *
 * The FastAPI starter installs from fully-resolved lock files, not from ranges:
 * `requirements.lock` for the development environment and
 * `requirements.runtime.lock` for the production image. An overlay must
 * therefore declare the **complete transitive closure** it adds, pinned — the
 * Factory resolves nothing, and a lock that is not a closure would install a
 * different set on the next run.
 *
 * Three sections, all required: `all` is that closure, `runtime` the subset the
 * production image installs, and `direct` the packages actually asked for —
 * `requirements.txt` stays readable instead of becoming a second lock. Both
 * subsets must be contained in `all`.
 */
export function validatePythonDependencies(block) {
  const issues = [];
  if (!block || typeof block !== 'object' || Array.isArray(block)) {
    return ['dependencies.python must be an object'];
  }
  for (const key of Object.keys(block)) {
    if (!['all', 'runtime', 'direct'].includes(key)) issues.push(`dependencies.python.${key} is not a known section`);
  }
  for (const section of ['all', 'runtime', 'direct']) {
    const pins = block[section];
    if (pins === undefined) {
      issues.push(`dependencies.python.${section} is required`);
      continue;
    }
    if (!Array.isArray(pins) || pins.length === 0) {
      issues.push(`dependencies.python.${section} must be a non-empty array`);
      continue;
    }
    for (const pin of pins) {
      if (typeof pin !== 'string' || !PYTHON_PIN.test(pin)) {
        issues.push(`dependencies.python.${section} entry is not a pinned requirement: ${pin}`);
      }
    }
    if (new Set(pins).size !== pins.length) issues.push(`dependencies.python.${section} must not repeat a package`);
  }
  // `all` is the closure; the other two name subsets of it. A pin that appears
  // nowhere in `all` would be installed by one path and not the other.
  if (Array.isArray(block.all)) {
    const closure = new Set(block.all);
    for (const section of ['runtime', 'direct']) {
      if (!Array.isArray(block[section])) continue;
      for (const pin of block[section]) {
        if (!closure.has(pin)) issues.push(`dependencies.python.${section} ${pin} is missing from dependencies.python.all`);
      }
    }
  }
  return issues;
}

/**
 * Adds pinned requirements to one lock file, sorted case-insensitively like the
 * baseline locks. A package already pinned at another version is a conflict, not
 * a silent overwrite — the same rule package.json, pom.xml and pubspec follow.
 */
export function mergeRequirementsLock(lock, pins, label) {
  const existing = new Map();
  for (const line of lock.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    const [name, version] = trimmed.split('==');
    existing.set(normalizePythonName(name), { version, line: trimmed });
  }
  for (const pin of pins) {
    const [name, version] = pin.split('==');
    const key = normalizePythonName(name);
    const current = existing.get(key);
    if (current === undefined) {
      existing.set(key, { version, line: pin });
      continue;
    }
    if (current.version !== version) {
      throw new Error(`${label}: dependency conflict on ${name} (${current.version} vs ${version})`);
    }
  }
  // Sorted by NORMALISED name, which is the order pip itself produces: it is why
  // `pydantic_core` precedes `pydantic-settings` in the baseline locks, where a
  // raw string sort would put them the other way round.
  const lines = [...existing.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, entry]) => entry.line);
  return `${lines.join('\n')}\n`;
}

/** PEP 503 normalisation: `typing_extensions` and `typing-extensions` are one package. */
function normalizePythonName(name) {
  return name.toLowerCase().replace(/[-_.]+/g, '-');
}

const PUBSPEC_SECTIONS = Object.freeze({ dependencies: 'dependencies', devDependencies: 'dev_dependencies' });

/**
 * Adds package constraints to one section of a pubspec.yaml.
 *
 * Deliberately line-based rather than a YAML round-trip: rewriting the document
 * would reformat comments and ordering the starter owns, and the Factory ships
 * no YAML dependency. The insertion point is the end of the named block — the
 * next line that starts at column zero — and entries land sorted so two
 * capabilities resolved in either order produce the same file.
 *
 * A package already present with a different constraint is a conflict, not a
 * silent overwrite: the same rule package.json and pom.xml already follow.
 */
export function mergePubspecSection(pubspec, section, entries, label) {
  const lines = pubspec.split('\n');
  const header = lines.findIndex((line) => line === `${section}:`);
  if (header < 0) throw new Error(`${label}: pubspec.yaml has no ${section} section`);

  let end = header + 1;
  while (end < lines.length && !/^[^\s#]/.test(lines[end])) end += 1;

  const existing = new Map();
  for (let index = header + 1; index < end; index += 1) {
    const match = /^ {2}([A-Za-z_][A-Za-z0-9_]*):(.*)$/.exec(lines[index]);
    if (match) existing.set(match[1], match[2].trim());
  }

  const additions = [];
  for (const [name, spec] of Object.entries(entries).sort(([a], [b]) => a.localeCompare(b))) {
    const current = existing.get(name);
    if (current === undefined) {
      additions.push(`  ${name}: ${spec}`);
      continue;
    }
    if (current !== spec) throw new Error(`${label}: dependency conflict on ${name} (${current} vs ${spec})`);
  }
  if (additions.length === 0) return pubspec;

  // Trailing blank lines belong to the separation between blocks, not to the block.
  let insertion = end;
  while (insertion > header + 1 && lines[insertion - 1].trim() === '') insertion -= 1;
  lines.splice(insertion, 0, ...additions);
  return lines.join('\n');
}

async function mergeDependencies(overlay, appDirectory) {
  const declared = overlay.manifest.dependencies;
  if (declared.python !== undefined) {
    const label = `${overlay.manifest.capability}/${overlay.manifest.target}`;
    // Both locks and the human-readable direct list are kept in step: the image
    // installs the runtime lock, CI installs the full lock, and requirements.txt
    // is what a reader consults to know what was actually asked for.
    for (const [file, pins] of [
      ['requirements.lock', declared.python.all],
      ['requirements.runtime.lock', declared.python.runtime],
      ['requirements.txt', declared.python.direct],
    ]) {
      const path = join(appDirectory, file);
      await writeFile(path, mergeRequirementsLock(await readFile(path, 'utf8'), pins, label));
    }
    return;
  }
  if (declared.maven !== undefined) {
    const pomPath = join(appDirectory, 'pom.xml');
    let pom = await readFile(pomPath, 'utf8');
    const entries = declared.maven;
    for (const entry of entries) {
      const marker = `<artifactId>${entry.artifactId}</artifactId>`;
      if (pom.includes(marker)) throw new Error(`${overlay.manifest.capability}/${overlay.manifest.target}: dependency conflict on ${entry.groupId}:${entry.artifactId}`);
      const dependency = [
        '        <dependency>',
        `            <groupId>${entry.groupId}</groupId>`,
        `            <artifactId>${entry.artifactId}</artifactId>`,
        ...(entry.version ? [`            <version>${entry.version}</version>`] : []),
        ...(entry.scope ? [`            <scope>${entry.scope}</scope>`] : []),
        '        </dependency>',
      ].join('\n');
      const insertion = pom.lastIndexOf('</dependencies>');
      if (insertion < 0) throw new Error(`${overlay.manifest.capability}/${overlay.manifest.target}: pom.xml has no dependencies section`);
      pom = `${pom.slice(0, insertion)}${dependency}\n${pom.slice(insertion)}`;
    }
    await writeFile(pomPath, pom);
    return;
  }
  const sections = ['dependencies', 'devDependencies'].filter((section) => Object.keys(declared[section] ?? {}).length > 0);
  if (sections.length === 0) return;
  if (getTargetAdapter(overlay.manifest.target)?.dependencyManager === 'pub') {
    const pubspecPath = join(appDirectory, 'pubspec.yaml');
    const label = `${overlay.manifest.capability}/${overlay.manifest.target}`;
    let pubspec = await readFile(pubspecPath, 'utf8');
    for (const section of sections) {
      pubspec = mergePubspecSection(pubspec, PUBSPEC_SECTIONS[section], declared[section], label);
    }
    await writeFile(pubspecPath, pubspec);
    return;
  }
  const packagePath = join(appDirectory, 'package.json');
  const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
  for (const section of sections) {
    const target = packageJson[section] ?? {};
    for (const [name, spec] of Object.entries(declared[section])) {
      if (target[name] !== undefined && target[name] !== spec) {
        throw new Error(`${overlay.manifest.capability}/${overlay.manifest.target}: dependency conflict on ${name} (${target[name]} vs ${spec})`);
      }
      target[name] = spec;
    }
    packageJson[section] = Object.fromEntries(Object.entries(target).sort(([a], [b]) => a.localeCompare(b)));
  }
  await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

async function appendEnvironment(overlay, appDirectory) {
  if (overlay.manifest.environment.length === 0) return;
  const envPath = join(appDirectory, '.env.example');
  const current = (await exists(envPath)) ? await readFile(envPath, 'utf8') : '';
  await writeFile(envPath, renderEnvironmentSection(current, overlay.manifest));
}

/** Reads a capability's declarative Prisma fragment. */
async function readPrismaFragment(overlay, integration) {
  const fragmentPath = join(overlay.directory, integration.source);
  try {
    return JSON.parse(await readFile(fragmentPath, 'utf8'));
  } catch (error) {
    throw new Error(`${overlay.manifest.capability}/${overlay.manifest.target}: invalid or missing prisma fragment ${integration.source} (${error.message})`);
  }
}

/** Appends the rendered composition to the baseline schema (single write). */
async function writePrismaComposition(appDirectory, composition, capabilities) {
  if (isEmptyPrismaComposition(composition)) return;
  const schemaPath = join(appDirectory, 'prisma', 'schema.prisma');
  const schema = await readFile(schemaPath, 'utf8');
  const banner = renderPrismaCompositionBanner(capabilities);
  await writeFile(schemaPath, `${schema}${banner}${renderPrismaComposition(composition)}`);
}

/**
 * Applies the overlays selected by the plan onto a materialized output.
 * Deterministic: optional capabilities resolve in registry order, files are
 * copied in declared order, integrations render sorted composition files.
 * Returns lock entries ({ capability, target, version, digest }) and the
 * verification argv lists per app kind.
 */
export async function applyCapabilityOverlays({ repoRoot, plan, output, capabilityManifests }) {
  const byId = new Map(capabilityManifests.map((manifest) => [manifest.id, manifest]));
  // The plan carries the dependency-first order produced by Capability Graph
  // v2. Materialization consumes that order directly; no second registry order
  // or dependency policy exists here.
  const orderedCapabilities = [...plan.capabilityGraph.order];
  // Iterate the canonical per-application plan (keyed by app id). Falls back to
  // deriving apps from starterSources for callers that only build that map.
  const apps = plan.applications
    ? plan.applications.map((app) => ({ id: app.id, appDir: app.appDir, starterId: app.runtime }))
    : Object.entries(plan.starterSources).map(([id, source]) => ({
      id, appDir: `apps/${id}`, starterId: source.split('/')[1] ?? source.split('/').at(-1),
    }));
  const applied = [];
  const verification = {};
  const integrationsByApp = new Map();

  for (const { id, appDir, starterId } of apps) {
    const appDirectory = join(output, appDir);
    const collected = [];
    // Typed intermediate Prisma model: capabilities contribute declarative
    // enums/models/field-extensions; the schema is rendered once, at the end.
    const prisma = createPrismaComposition();
    const prismaCapabilities = [];
    for (const capabilityId of orderedCapabilities) {
      const target = byId.get(capabilityId)?.targets?.[starterId];
      if (!target) throw new Error(`Capability ${capabilityId} on ${starterId} is unknown`);
      // `not-applicable`: the capability legitimately has no surface on this target
      // (e.g. RBAC on mobile — decisions come from the API). Compose nothing, and
      // never inject a placeholder overlay.
      if (target.status === 'not-applicable') continue;
      if (target.status !== 'ready') throw new Error(`Capability ${capabilityId} on ${starterId} is ${target.status}`);
      if (target.mode !== 'overlay') continue;
      const overlay = await loadOverlay(repoRoot, capabilityId, starterId);
      for (const entry of overlay.manifest.files) await copyOverlayEntry(overlay, entry, appDirectory);
      await mergeDependencies(overlay, appDirectory);
      await appendEnvironment(overlay, appDirectory);
      // Prisma contributions accumulate into the typed model (order matters: a
      // capability can only extend a model declared by an earlier one); every
      // other integration is collected and rendered once per app.
      for (const integration of overlay.manifest.integrations) {
        if (integration.kind === 'nestjs.prisma-schema') {
          const fragment = await readPrismaFragment(overlay, integration);
          try {
            applyPrismaFragment(prisma, fragment, capabilityId);
          } catch (error) {
            throw new Error(`${capabilityId}/${starterId}: ${error.message}`);
          }
          if (!prismaCapabilities.includes(capabilityId)) prismaCapabilities.push(capabilityId);
        } else {
          collected.push({ ...integration, capability: capabilityId });
        }
      }
      applied.push({
        capability: capabilityId,
        target: starterId,
        version: overlay.manifest.version,
        digest: await computeOverlayDigest(overlay),
        ...(overlay.manifest.contract?.openapiOperations
          ? { openapiOperations: [...overlay.manifest.contract.openapiOperations] }
          : {}),
      });
      if (overlay.manifest.verification.length > 0) {
        verification[id] = [...(verification[id] ?? []), ...overlay.manifest.verification];
      }
    }
    // Domain compiler (R9): entities become a synthetic capability rendered by
    // the target adapter, composed through the SAME prisma + integration seams.
    const domain = buildDomainContribution(plan.domain?.entities ?? [], getTargetAdapter(starterId));
    if (domain) {
      for (const file of domain.files) await writeDomainFile(appDirectory, file);
      if (domain.prisma) {
        try {
          applyPrismaFragment(prisma, domain.prisma, 'domain');
        } catch (error) {
          throw new Error(`domain/${starterId}: ${error.message}`);
        }
        if (!prismaCapabilities.includes('domain')) prismaCapabilities.push('domain');
      }
      for (const integration of domain.integrations) collected.push({ ...integration, capability: 'domain' });
      applied.push({
        capability: 'domain',
        target: starterId,
        version: domain.version,
        digest: domain.digest,
        ...(domain.contract?.openapiOperations ? { openapiOperations: [...domain.contract.openapiOperations] } : {}),
      });
    }
    await writePrismaComposition(appDirectory, prisma, prismaCapabilities);
    integrationsByApp.set(id, { starterId, appDirectory, integrations: collected });
  }

  for (const { starterId, appDirectory, integrations } of integrationsByApp.values()) {
    await renderCompositionFiles(starterId, appDirectory, integrations);
  }

  return { applied, verification };
}

async function writeGenerated(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

/** Writes one generated domain file (in-memory contents), path-safe, no clobber. */
async function writeDomainFile(appDirectory, file) {
  if (!isSafeRelativePath(file.destination ?? '')) throw new Error(`domain: unsafe destination ${file.destination}`);
  const destination = join(appDirectory, file.destination);
  if (await exists(destination)) throw new Error(`domain: undeclared file conflict at ${file.destination}`);
  await writeGenerated(destination, file.contents);
}

/**
 * Renders the collected integrations into composition files using the target
 * adapter's declarative `composition` binding. The engine stays agnostic: it
 * groups integrations by the adapter's declared kinds, writes each group to its
 * destination with its pure renderer (declaration order preserved), and refuses
 * any integration kind the adapter does not bind to a renderer.
 */
async function renderCompositionFiles(starterId, appDirectory, integrations) {
  const groups = getTargetAdapter(starterId)?.composition ?? [];
  const handled = new Set(groups.flatMap((group) => group.kinds));
  const unhandled = integrations.find((integration) => !handled.has(integration.kind));
  if (unhandled) throw new Error(`No composition renderer for starter ${starterId}: ${unhandled.kind}`);
  for (const group of groups) {
    const items = integrations.filter((integration) => group.kinds.includes(integration.kind));
    if (items.length > 0) await writeGenerated(join(appDirectory, group.destination), group.render(items));
  }
}
