/**
 * Versioned target-adapter registry.
 *
 * The composition engine owns ordering, conflicts, files, dependencies and
 * locks. Target adapters declare the integration operations they accept AND how
 * their known integration kinds are rendered into composition files
 * (`composition`): each group binds a set of kinds to a destination path and a
 * pure renderer. The engine stays framework-agnostic — it iterates adapters and
 * never switches on a starter id. No adapter executes arbitrary manifest code.
 */

import {
  renderNestjsComposition,
  renderPrismaSeedRegistry,
  renderSpringComposition,
  renderNextjsCapabilityProviders,
  renderNextjsPublicNav,
  renderNextjsDashboardNav,
  renderNextjsStatusSections,
  renderExpoCapabilityProviders,
  renderExpoHomeActions,
} from './overlay-renderers.mjs';
import { renderNestjsDomain } from './domain-renderers/nestjs.mjs';

const STRING = 'string';
const INTEGER = 'integer';

export const COMMON_OPERATIONS = Object.freeze([
  'files', 'dependencies', 'environment', 'integrations', 'contract', 'verification',
]);

/** Deep-freezes a composition descriptor list (kinds bound to a destination + renderer). */
function freezeComposition(composition) {
  return Object.freeze((composition ?? []).map((group) => Object.freeze({
    ...group,
    kinds: Object.freeze([...group.kinds]),
  })));
}

const BUILT_IN = [
  {
    id: 'nestjs', version: '1.0.0', integrationKinds: {
      'nestjs.module': { importPath: STRING, symbol: STRING },
      'nestjs.global-guard': { importPath: STRING, symbol: STRING, order: INTEGER },
      'nestjs.throttler': { name: STRING, limitEnv: STRING, defaultLimit: INTEGER, ttlSecondsEnv: STRING, defaultTtlSeconds: INTEGER },
      'nestjs.prisma-schema': { source: STRING },
      'nestjs.prisma-seed': { importPath: STRING, symbol: STRING, order: INTEGER },
    },
    // `nestjs.prisma-schema` is intentionally absent: prisma fragments compose
    // into the typed schema in the engine's main loop, not as a rendered file.
    composition: [
      { kinds: ['nestjs.prisma-seed'], destination: 'prisma/seed/capability-seeds.ts', render: renderPrismaSeedRegistry },
      { kinds: ['nestjs.module', 'nestjs.global-guard', 'nestjs.throttler'], destination: 'src/composition/capabilities.ts', render: renderNestjsComposition },
    ],
    // Domain compiler (R9): entities -> Prisma model + CRUD service + module.
    renderDomain: renderNestjsDomain,
  },
  {
    id: 'nextjs', version: '1.0.0', integrationKinds: {
      'nextjs.provider': { importPath: STRING, symbol: STRING },
      'nextjs.public-nav-link': { href: STRING, label: STRING },
      'nextjs.dashboard-nav-link': { href: STRING, label: STRING, order: INTEGER },
      'nextjs.status-section': { importPath: STRING, symbol: STRING, order: INTEGER },
    },
    composition: [
      { kinds: ['nextjs.provider'], destination: 'src/app/providers/capability-providers.tsx', render: renderNextjsCapabilityProviders },
      { kinds: ['nextjs.public-nav-link'], destination: 'src/core/composition/public-nav.ts', render: renderNextjsPublicNav },
      { kinds: ['nextjs.dashboard-nav-link'], destination: 'src/core/composition/dashboard-nav.ts', render: renderNextjsDashboardNav },
      { kinds: ['nextjs.status-section'], destination: 'src/core/composition/status-sections.tsx', render: renderNextjsStatusSections },
    ],
  },
  {
    id: 'react-native', version: '1.0.0', integrationKinds: {
      'expo.provider': { importPath: STRING, symbol: STRING },
      'expo.home-action': { href: STRING, label: STRING, order: INTEGER },
    },
    composition: [
      { kinds: ['expo.provider'], destination: 'src/composition/capability-providers.tsx', render: renderExpoCapabilityProviders },
      { kinds: ['expo.home-action'], destination: 'src/composition/home-actions.ts', render: renderExpoHomeActions },
    ],
  },
  { id: 'spring', version: '1.0.0', dependencyManager: 'maven', integrationKinds: {
    'spring.module': { importPath: STRING, symbol: STRING },
  }, composition: [
    { kinds: ['spring.module'], destination: 'src/main/java/com/enistere/core/composition/CapabilityConfiguration.java', render: renderSpringComposition },
  ] },
  { id: 'angular', version: '1.0.0', integrationKinds: {}, composition: [] },
  { id: 'flutter', version: '1.0.0', integrationKinds: {}, composition: [] },
].map((adapter) => Object.freeze({
  ...adapter,
  operations: Object.freeze([...(adapter.operations ?? COMMON_OPERATIONS)]),
  integrationKinds: Object.freeze(Object.fromEntries(
    Object.entries(adapter.integrationKinds).map(([kind, fields]) => [kind, Object.freeze({ ...fields })]),
  )),
  composition: freezeComposition(adapter.composition),
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
    composition: freezeComposition(adapter.composition),
    renderDomain: adapter.renderDomain ?? null,
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
