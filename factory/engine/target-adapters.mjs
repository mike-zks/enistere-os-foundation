/**
 * Versioned target-adapter registry.
 *
 * The composition engine owns ordering, conflicts, files, dependencies and
 * locks. Target adapters only declare the integration operations they accept.
 * No adapter executes arbitrary manifest code.
 */

const STRING = 'string';
const INTEGER = 'integer';

export const COMMON_OPERATIONS = Object.freeze([
  'files', 'dependencies', 'environment', 'integrations', 'contract', 'verification',
]);

const BUILT_IN = [
  {
    id: 'nestjs', version: '1.0.0', integrationKinds: {
      'nestjs.module': { importPath: STRING, symbol: STRING },
      'nestjs.global-guard': { importPath: STRING, symbol: STRING, order: INTEGER },
      'nestjs.throttler': { name: STRING, limitEnv: STRING, defaultLimit: INTEGER, ttlSecondsEnv: STRING, defaultTtlSeconds: INTEGER },
      'nestjs.prisma-schema': { source: STRING },
      'nestjs.prisma-seed': { importPath: STRING, symbol: STRING, order: INTEGER },
    },
  },
  {
    id: 'nextjs', version: '1.0.0', integrationKinds: {
      'nextjs.provider': { importPath: STRING, symbol: STRING },
      'nextjs.public-nav-link': { href: STRING, label: STRING },
      'nextjs.dashboard-nav-link': { href: STRING, label: STRING, order: INTEGER },
      'nextjs.status-section': { importPath: STRING, symbol: STRING, order: INTEGER },
    },
  },
  {
    id: 'react-native', version: '1.0.0', integrationKinds: {
      'expo.provider': { importPath: STRING, symbol: STRING },
      'expo.home-action': { href: STRING, label: STRING, order: INTEGER },
    },
  },
  { id: 'spring', version: '1.0.0', dependencyManager: 'maven', integrationKinds: {
    'spring.module': { importPath: STRING, symbol: STRING },
  } },
  { id: 'angular', version: '1.0.0', integrationKinds: {} },
  { id: 'flutter', version: '1.0.0', integrationKinds: {} },
].map((adapter) => Object.freeze({
  ...adapter,
  operations: Object.freeze([...(adapter.operations ?? COMMON_OPERATIONS)]),
  integrationKinds: Object.freeze(Object.fromEntries(
    Object.entries(adapter.integrationKinds).map(([kind, fields]) => [kind, Object.freeze({ ...fields })]),
  )),
}));

const adapters = new Map(BUILT_IN.map((adapter) => [adapter.id, adapter]));

function assertAdapter(adapter) {
  if (!adapter || !/^[a-z][a-z0-9-]*$/.test(adapter.id ?? '')) throw new Error('target adapter id is invalid');
  if (!/^\d+\.\d+\.\d+$/.test(adapter.version ?? '')) throw new Error(`${adapter.id}: adapter version must be SemVer`);
  if (!adapter.integrationKinds || typeof adapter.integrationKinds !== 'object') throw new Error(`${adapter.id}: integrationKinds must be an object`);
  if (adapter.operations !== undefined && (!Array.isArray(adapter.operations) || adapter.operations.some((operation) => typeof operation !== 'string' || operation === ''))) {
    throw new Error(`${adapter.id}: operations must be non-empty strings`);
  }
}

export function registerTargetAdapter(adapter) {
  assertAdapter(adapter);
  if (adapters.has(adapter.id)) throw new Error(`target adapter already registered: ${adapter.id}`);
  const frozen = Object.freeze({
    id: adapter.id,
    version: adapter.version,
    dependencyManager: adapter.dependencyManager ?? 'npm',
    integrationKinds: Object.freeze({ ...adapter.integrationKinds }),
    operations: Object.freeze([...(adapter.operations ?? COMMON_OPERATIONS)]),
  });
  adapters.set(frozen.id, frozen);
  return frozen;
}

export function getTargetAdapter(id) {
  return adapters.get(id) ?? null;
}

export function listTargetAdapters() {
  return [...adapters.values()];
}

export function integrationKindsFor(id) {
  return getTargetAdapter(id)?.integrationKinds ?? null;
}

export function adapterVersionsFor(ids) {
  return Object.fromEntries(ids.map((id) => [id, getTargetAdapter(id)?.version ?? null]));
}

export function resetTargetAdaptersForTests() {
  for (const id of [...adapters.keys()]) if (!BUILT_IN.some((adapter) => adapter.id === id)) adapters.delete(id);
}
