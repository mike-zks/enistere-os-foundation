/**
 * System-profile taxonomy (ADR-060).
 *
 * A system profile expresses the purpose and governance of the whole system.
 * Client count, backend style, deployment coupling, data ownership,
 * communication mode and operational maturity are independent dimensions.
 *
 * Historical profile names are accepted only at the Blueprint boundary. The
 * Canonical System Model always contains one of the four canonical ids.
 */

export const SYSTEM_PROFILES = Object.freeze([
  'backend-service',
  'product-platform',
  'distributed-platform',
  'service-ecosystem',
]);

export const CLIENT_MODES = Object.freeze(['none', 'single', 'multiple']);
export const BACKEND_STYLES = Object.freeze(['modular-monolith', 'distributed-services', 'microservices']);
export const DEPLOYMENT_COUPLINGS = Object.freeze(['coordinated', 'partially-independent', 'independent']);
export const DATA_OWNERSHIP_MODES = Object.freeze(['shared', 'bounded-context', 'per-service']);
export const COMMUNICATION_MODES = Object.freeze(['synchronous', 'event-driven', 'hybrid']);
export const OPERATIONS_MATURITY_LEVELS = Object.freeze(['standard', 'advanced', 'distributed']);

export const LEGACY_SYSTEM_PROFILE_ALIASES = Object.freeze({
  api: 'backend-service',
  monolith: 'product-platform',
  'multi-client': 'product-platform',
  'modular-distributed': 'distributed-platform',
  microservices: 'service-ecosystem',
});

export const SYSTEM_PROFILE_DEFINITIONS = Object.freeze({
  'backend-service': Object.freeze({
    id: 'backend-service',
    purpose: 'Expose an autonomous backend capability without requiring an official client.',
    representation: 'IMPLEMENTED',
    generation: 'GENERATABLE',
    generationScope: 'registered and proven composition presets only',
  }),
  'product-platform': Object.freeze({
    id: 'product-platform',
    purpose: 'Deliver one coherent product through a primary backend and one or more official clients.',
    representation: 'IMPLEMENTED',
    generation: 'GENERATABLE',
    generationScope: 'registered and proven composition presets only',
  }),
  'distributed-platform': Object.freeze({
    id: 'distributed-platform',
    purpose: 'Separate selected backend domains or technologies while retaining shared product governance.',
    representation: 'IMPLEMENTED',
    generation: 'PLANNED',
    generationScope: 'representation only; multiple backends are refused',
  }),
  'service-ecosystem': Object.freeze({
    id: 'service-ecosystem',
    purpose: 'Operate independently deployable, data-owning services through autonomous teams.',
    representation: 'IMPLEMENTED',
    generation: 'PLANNED',
    generationScope: 'representation only; autonomous services are refused',
  }),
});

const PROFILE_DEFAULTS = Object.freeze({
  'backend-service': Object.freeze({
    backendStyle: 'modular-monolith',
    deploymentCoupling: 'coordinated',
    dataOwnership: 'bounded-context',
    communication: 'synchronous',
    operationsMaturity: 'standard',
  }),
  'product-platform': Object.freeze({
    backendStyle: 'modular-monolith',
    deploymentCoupling: 'coordinated',
    dataOwnership: 'bounded-context',
    communication: 'synchronous',
    operationsMaturity: 'standard',
  }),
  'distributed-platform': Object.freeze({
    backendStyle: 'distributed-services',
    deploymentCoupling: 'partially-independent',
    dataOwnership: 'bounded-context',
    communication: 'hybrid',
    operationsMaturity: 'advanced',
  }),
  'service-ecosystem': Object.freeze({
    backendStyle: 'microservices',
    deploymentCoupling: 'independent',
    dataOwnership: 'per-service',
    communication: 'hybrid',
    operationsMaturity: 'distributed',
  }),
});

/** Returns the canonical profile id for a canonical id or historical alias. */
export function canonicalSystemProfile(value) {
  if (SYSTEM_PROFILES.includes(value)) return value;
  return LEGACY_SYSTEM_PROFILE_ALIASES[value] ?? null;
}

/** Infers the least-distributed profile supported by the declared applications. */
export function inferSystemProfile(applications) {
  const apiCount = applications.filter((app) => app.kind === 'api').length;
  const clientCount = applications.filter((app) => app.kind === 'web' || app.kind === 'mobile').length;
  if (apiCount > 1) return 'distributed-platform';
  return clientCount === 0 ? 'backend-service' : 'product-platform';
}

export function inferClientMode(applications) {
  const count = applications.filter((app) => app.kind === 'web' || app.kind === 'mobile').length;
  if (count === 0) return 'none';
  return count === 1 ? 'single' : 'multiple';
}

/**
 * Normalizes Blueprint architecture input into the complete canonical
 * architecture dimensions. `style` is migration-only input.
 */
export function normalizeSystemArchitecture(input = {}, applications = []) {
  const legacyStyle = input.style;
  const requestedProfile = input.profile ?? (
    legacyStyle === 'microservices' ? 'microservices'
      : legacyStyle === 'monolith' ? 'monolith'
        : undefined
  );
  const profile = requestedProfile === undefined
    ? inferSystemProfile(applications)
    : canonicalSystemProfile(requestedProfile) ?? requestedProfile;
  const defaults = PROFILE_DEFAULTS[profile] ?? PROFILE_DEFAULTS[inferSystemProfile(applications)];
  const legacyBackendStyle = legacyStyle === 'monolith' ? 'modular-monolith' : legacyStyle;
  const evolutionTarget = input.evolutionTarget === undefined
    ? undefined
    : canonicalSystemProfile(input.evolutionTarget) ?? input.evolutionTarget;

  const architecture = {
    profile,
    clients: { mode: input.clients?.mode ?? inferClientMode(applications) },
    backend: { style: input.backend?.style ?? (BACKEND_STYLES.includes(legacyBackendStyle) ? legacyBackendStyle : defaults.backendStyle) },
    deployment: { coupling: input.deployment?.coupling ?? defaults.deploymentCoupling },
    data: { ownership: input.data?.ownership ?? defaults.dataOwnership },
    communication: { primary: input.communication?.primary ?? defaults.communication },
    operations: { maturity: input.operations?.maturity ?? defaults.operationsMaturity },
  };
  if (evolutionTarget !== undefined) architecture.evolutionTarget = evolutionTarget;
  return architecture;
}
