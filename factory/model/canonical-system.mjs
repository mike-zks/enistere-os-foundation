/**
 * Canonical System Model (ADR-045) — the normalized internal representation of an
 * Enistere system.
 *
 * The CSM is the frontier between the user blueprint and the Factory engine. It is
 * typed, deterministic and independent of the input format (YAML/JSON) and of the
 * templates. This module owns the SHAPE only: registries of allowed values,
 * frozen factories, and a deterministic serialization + digest. It is PURE — it
 * does not import the engine. The kind→runtime rules live in the engine's
 * `topologies.mjs` registry and are applied by the ingestion layer
 * (`factory/blueprint/`), which keeps a single source of truth.
 *
 * Minimal by design (ADR-045 §Périmètre): the shape covers what the current
 * pipeline needs and reserves the V2 extensions without activating them.
 */

import { createHash } from 'node:crypto';

/** The CSM's own version (distinct from the blueprint schema version). */
export const SYSTEM_API_VERSION = 'enistere.io/v1alpha1';

/** Architecture styles the model supports today. */
export const SUPPORTED_ARCHITECTURE_STYLES = Object.freeze(['standard', 'multi-client', 'modular-monolith']);

/** Styles reserved in the type but explicitly not supported yet (refused by validation). */
export const RESERVED_ARCHITECTURE_STYLES = Object.freeze(['service-oriented', 'microservices']);

/** Every style the model can name (supported first, then reserved). */
export const ARCHITECTURE_STYLES = Object.freeze([...SUPPORTED_ARCHITECTURE_STYLES, ...RESERVED_ARCHITECTURE_STYLES]);

/** Application kinds the minimal CSM models. */
export const APPLICATION_KINDS = Object.freeze(['api', 'web', 'mobile']);

/** Runtimes the CSM recognizes (the six Foundation runtimes). */
export const RUNTIMES = Object.freeze(['nestjs', 'spring', 'nextjs', 'angular', 'react-native', 'flutter']);

/** Environment kinds the CSM recognizes. */
export const ENVIRONMENT_KINDS = Object.freeze(['local', 'staging', 'production']);

/**
 * Recursively stringifies a value with object keys sorted, so the same model
 * always serializes to the same string. Array order is preserved (it is semantic
 * and the normalizer builds arrays deterministically). No timestamps, no absolute
 * paths, no randomness.
 */
export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

/** A canonical application. Optional fields are omitted when absent. */
export function canonicalApplication({ id, kind, runtime, sourceProfile, consumes = [], capabilities = [], options = {} }) {
  const app = { id, kind, runtime, consumes: [...consumes], capabilities: [...capabilities], options: { ...options } };
  if (sourceProfile !== undefined) app.sourceProfile = sourceProfile;
  return Object.freeze(app);
}

/** A canonical capability with its per-application targets. */
export function canonicalCapability({ id, version, targets = [], configuration = {} }) {
  const capability = { id, targets: [...targets], configuration: { ...configuration } };
  if (version !== undefined) capability.version = version;
  return Object.freeze(capability);
}

/** A canonical environment. */
export function canonicalEnvironment({ id, kind }) {
  return Object.freeze({ id, kind });
}

/**
 * Assembles a frozen CanonicalSystem and stamps `source.digest` with a stable
 * sha256 over the whole model (digest field excluded from its own input).
 */
export function canonicalSystem({ metadata, architecture, applications, capabilities, environments, policies = {}, source }) {
  const base = {
    apiVersion: SYSTEM_API_VERSION,
    metadata: { ...metadata },
    architecture: { ...architecture },
    applications: [...applications],
    capabilities: [...capabilities],
    environments: [...environments],
    policies: { ...policies },
    source: { ...source },
  };
  const digest = createHash('sha256').update(stableStringify({ ...base, source: { ...source, digest: undefined } })).digest('hex');
  base.source = Object.freeze({ ...source, digest });
  return Object.freeze(base);
}

/** Deterministic serialization of a CSM (stable key order). */
export function serializeCanonicalSystem(system) {
  return stableStringify(system);
}
