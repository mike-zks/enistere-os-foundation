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

const LEGACY_PROFILE_DIMENSIONS = Object.freeze({
  api: Object.freeze({ clientMode: 'none' }),
  monolith: Object.freeze({ backendStyle: 'modular-monolith' }),
  'multi-client': Object.freeze({ clientMode: 'multiple' }),
  'modular-distributed': Object.freeze({ backendStyle: 'distributed-services' }),
  microservices: Object.freeze({ backendStyle: 'microservices' }),
});

export const SYSTEM_PROFILE_DEFINITIONS = Object.freeze({
  'backend-service': Object.freeze({
    id: 'backend-service',
    label: 'Backend service',
    purpose: 'Expose an autonomous backend capability without requiring an official client.',
    status: 'GENERATABLE',
    representation: 'IMPLEMENTED',
    generation: 'GENERATABLE',
    generationScope: 'registered and proven composition presets only',
    selection: 'The backend capability is the product and official user clients are outside the system boundary.',
    refusal: 'Refuse when Enistere must own an official web/mobile experience or several backend authorities.',
    evolution: 'May become the backend authority of a product-platform or an owned unit of a distributed-platform.',
  }),
  'product-platform': Object.freeze({
    id: 'product-platform',
    label: 'Product platform',
    purpose: 'Deliver one coherent product through a primary backend and one or more official clients.',
    status: 'GENERATABLE',
    representation: 'IMPLEMENTED',
    generation: 'GENERATABLE',
    generationScope: 'registered and proven composition presets only',
    selection: 'One product authority and coordinated governance dominate, regardless of the number of clients.',
    refusal: 'Refuse when a backend domain already requires independent release, security isolation or data authority.',
    evolution: 'Extract one proven boundary at a time toward distributed-platform.',
  }),
  'distributed-platform': Object.freeze({
    id: 'distributed-platform',
    label: 'Distributed platform',
    purpose: 'Separate selected backend domains or technologies while retaining shared product governance.',
    status: 'PLANNED',
    representation: 'IMPLEMENTED',
    generation: 'PLANNED',
    generationScope: 'representation only; multiple backends are refused',
    selection: 'Several backend authorities are justified by technology, scale, security or an existing-system boundary.',
    refusal: 'Refuse when one team cannot operate several units or global synchronous transactions remain necessary.',
    evolution: 'Extract or reintegrate bounded authorities incrementally; require explicit ownership and contracts.',
  }),
  'service-ecosystem': Object.freeze({
    id: 'service-ecosystem',
    label: 'Service ecosystem',
    purpose: 'Operate independently deployable, data-owning services through autonomous teams.',
    status: 'TARGET',
    representation: 'IMPLEMENTED',
    generation: 'PLANNED',
    generationScope: 'representation only; autonomous services are refused',
    selection: 'Independent teams, releases, data ownership and failure domains are all demonstrated requirements.',
    refusal: 'Refuse for one operating team, unknown boundaries or absent distributed-operations maturity.',
    evolution: 'Extract from a distributed-platform only after organizational and operational proofs exist.',
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

/** Default six-dimensional architecture for one canonical system profile. */
export function systemProfileDefaultArchitecture(profile) {
  const canonical = canonicalSystemProfile(profile);
  if (!canonical) return null;
  const defaults = PROFILE_DEFAULTS[canonical];
  return {
    profile: canonical,
    clients: { mode: canonical === 'product-platform' ? 'single' : 'none' },
    backend: { style: defaults.backendStyle },
    deployment: { coupling: defaults.deploymentCoupling },
    data: { ownership: defaults.dataOwnership },
    communication: { primary: defaults.communication },
    operations: { maturity: defaults.operationsMaturity },
  };
}

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
  const legacyDimensions = LEGACY_PROFILE_DIMENSIONS[requestedProfile] ?? {};
  const legacyBackendStyle = legacyStyle === 'monolith' ? 'modular-monolith' : legacyStyle;
  const evolutionTarget = input.evolutionTarget === undefined
    ? undefined
    : canonicalSystemProfile(input.evolutionTarget) ?? input.evolutionTarget;

  const architecture = {
    profile,
    clients: { mode: input.clients?.mode ?? legacyDimensions.clientMode ?? inferClientMode(applications) },
    backend: {
      style: input.backend?.style
        ?? legacyDimensions.backendStyle
        ?? (BACKEND_STYLES.includes(legacyBackendStyle) ? legacyBackendStyle : defaults.backendStyle),
    },
    deployment: { coupling: input.deployment?.coupling ?? defaults.deploymentCoupling },
    data: { ownership: input.data?.ownership ?? defaults.dataOwnership },
    communication: { primary: input.communication?.primary ?? defaults.communication },
    operations: { maturity: input.operations?.maturity ?? defaults.operationsMaturity },
  };
  if (evolutionTarget !== undefined) architecture.evolutionTarget = evolutionTarget;
  return architecture;
}
