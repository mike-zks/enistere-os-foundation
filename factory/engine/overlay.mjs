import { access, cp, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, normalize, sep } from 'node:path';
import { CAPABILITY_IDS } from './capabilities.mjs';
import { STARTER_IDS } from './starters.mjs';
import {
  addPrismaModelField,
  renderEnvironmentSection,
  renderExpoCapabilityProviders,
  renderNestjsComposition,
  renderNextjsCapabilityProviders,
  renderNextjsPublicNav,
  renderPrismaFragmentBanner,
} from './overlay-renderers.mjs';

const SEMVER = /^\d+\.\d+\.\d+$/;
const ENV_NAME = /^[A-Z][A-Z0-9_]*$/;

/**
 * Known integration kinds, per target. An overlay requesting anything else is
 * rejected: the engine is the only interpreter of overlay operations and only
 * renders integrations it fully understands (no scripts, no hooks, no patches).
 */
const S = 'string';
const I = 'integer';

export const INTEGRATION_KINDS = Object.freeze({
  nestjs: Object.freeze({
    'nestjs.module': { importPath: S, symbol: S },
    // `order` makes the global guard chain deterministic regardless of the order
    // in which capabilities are composed (authentication before authorization).
    'nestjs.global-guard': { importPath: S, symbol: S, order: I },
    'nestjs.throttler': { name: S, limitEnv: S, defaultLimit: I, ttlSecondsEnv: S, defaultTtlSeconds: I },
    'nestjs.prisma-fragment': { source: S },
    // Structured extension of a model defined by an earlier fragment (e.g. adding
    // the RBAC back-relation to Auth's `User`) — block-aware, never a regex patch.
    'nestjs.prisma-model-field': { model: S, field: S, type: S },
  }),
  nextjs: Object.freeze({
    'nextjs.provider': { importPath: S, symbol: S },
    'nextjs.public-nav-link': { href: S, label: S },
  }),
  'react-native': Object.freeze({
    'expo.provider': { importPath: S, symbol: S },
  }),
});

function isSafeRelativePath(value) {
  if (typeof value !== 'string' || value === '' || value.startsWith('/') || value.includes('\\')) return false;
  if (value.split('/').includes('..')) return false;
  const parts = normalize(value).split(sep);
  return !parts.includes('..') && parts[0] !== '';
}

export function validateOverlayManifest(value, { capability, target } = {}) {
  const issues = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ['overlay must be an object'];
  const allowedKeys = new Set(['schemaVersion', 'capability', 'target', 'version', 'description', 'files', 'dependencies', 'environment', 'integrations', 'verification']);
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

  if (!value.dependencies || typeof value.dependencies !== 'object' || Array.isArray(value.dependencies)) issues.push('dependencies must be an object');
  else {
    for (const key of Object.keys(value.dependencies)) if (!['dependencies', 'devDependencies'].includes(key)) issues.push(`dependencies.${key} is not supported`);
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

  const knownKinds = INTEGRATION_KINDS[value.target] ?? {};
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
    if (entry.kind === 'nestjs.prisma-fragment' && !isSafeRelativePath(entry.source ?? '')) issues.push(`integrations[${index}].source must be a safe relative path`);
    if (entry.kind === 'nestjs.prisma-model-field' && !/^[A-Z][A-Za-z0-9_]*$/.test(entry.model ?? '')) {
      issues.push(`integrations[${index}].model must be a Prisma model name`);
    }
    if (entry.kind === 'nestjs.prisma-model-field' && !/^[a-z][A-Za-z0-9_]*$/.test(entry.field ?? '')) {
      issues.push(`integrations[${index}].field must be a Prisma field name`);
    }
  });

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

async function mergeDependencies(overlay, appDirectory) {
  const declared = overlay.manifest.dependencies;
  const sections = ['dependencies', 'devDependencies'].filter((section) => Object.keys(declared[section] ?? {}).length > 0);
  if (sections.length === 0) return;
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

async function appendPrismaFragment(overlay, integration, appDirectory) {
  const fragmentPath = join(overlay.directory, integration.source);
  let fragment;
  try {
    fragment = await readFile(fragmentPath, 'utf8');
  } catch {
    throw new Error(`${overlay.manifest.capability}/${overlay.manifest.target}: missing prisma fragment ${integration.source}`);
  }
  const schemaPath = join(appDirectory, 'prisma', 'schema.prisma');
  const schema = await readFile(schemaPath, 'utf8');
  await writeFile(schemaPath, `${schema}${renderPrismaFragmentBanner(overlay.manifest.capability)}${fragment.trimEnd()}\n`);
}

/** Structured extension of a model owned by an earlier fragment (back-relations). */
async function extendPrismaModel(overlay, integration, appDirectory) {
  const schemaPath = join(appDirectory, 'prisma', 'schema.prisma');
  const schema = await readFile(schemaPath, 'utf8');
  try {
    await writeFile(schemaPath, addPrismaModelField(schema, integration, overlay.manifest.capability));
  } catch (error) {
    throw new Error(`${overlay.manifest.capability}/${overlay.manifest.target}: ${error.message}`);
  }
}

/**
 * Applies the overlays selected by the plan onto a materialized output.
 * Deterministic: capabilities resolve in registry order (base first), files are
 * copied in declared order, integrations render sorted composition files.
 * Returns lock entries ({ capability, target, version, digest }) and the
 * verification argv lists per app kind.
 */
export async function applyCapabilityOverlays({ repoRoot, blueprint, plan, output, capabilityManifests }) {
  const byId = new Map(capabilityManifests.map((manifest) => [manifest.id, manifest]));
  const orderedCapabilities = CAPABILITY_IDS.filter((id) => blueprint.capabilities.includes(id));
  const kinds = Object.entries(plan.starterSources).map(([kind, source]) => ({ kind, starterId: source.split('/').at(-1) }));
  const applied = [];
  const verification = {};
  const integrationsByApp = new Map();

  for (const { kind, starterId } of kinds) {
    const appDirectory = join(output, `apps/${kind}`);
    const collected = [];
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
      // Prisma operations apply immediately and in order (a fragment must exist
      // before a later capability extends one of its models); the rest is
      // collected and rendered once per app into the composition files.
      for (const integration of overlay.manifest.integrations) {
        if (integration.kind === 'nestjs.prisma-fragment') await appendPrismaFragment(overlay, integration, appDirectory);
        else if (integration.kind === 'nestjs.prisma-model-field') await extendPrismaModel(overlay, integration, appDirectory);
        else collected.push(integration);
      }
      applied.push({
        capability: capabilityId,
        target: starterId,
        version: overlay.manifest.version,
        digest: await computeOverlayDigest(overlay),
      });
      if (overlay.manifest.verification.length > 0) {
        verification[kind] = [...(verification[kind] ?? []), ...overlay.manifest.verification];
      }
    }
    integrationsByApp.set(kind, { starterId, appDirectory, integrations: collected });
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

async function renderCompositionFiles(starterId, appDirectory, integrations) {
  if (starterId === 'nestjs') {
    if (integrations.length === 0) return;
    await writeGenerated(join(appDirectory, 'src/composition/capabilities.ts'), renderNestjsComposition(integrations));
    return;
  }
  if (starterId === 'nextjs') {
    const providers = integrations.filter((item) => item.kind === 'nextjs.provider');
    const navLinks = integrations.filter((item) => item.kind === 'nextjs.public-nav-link');
    if (providers.length > 0) await writeGenerated(join(appDirectory, 'src/app/providers/capability-providers.tsx'), renderNextjsCapabilityProviders(providers));
    if (navLinks.length > 0) await writeGenerated(join(appDirectory, 'src/core/composition/public-nav.ts'), renderNextjsPublicNav(navLinks));
    return;
  }
  if (starterId === 'react-native') {
    const providers = integrations.filter((item) => item.kind === 'expo.provider');
    if (providers.length > 0) await writeGenerated(join(appDirectory, 'src/composition/capability-providers.tsx'), renderExpoCapabilityProviders(providers));
    return;
  }
  if (integrations.length > 0) throw new Error(`No composition renderer for starter: ${starterId}`);
}
