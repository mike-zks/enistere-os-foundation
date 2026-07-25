/**
 * Canonical System Model (ADR-045, complété ADR-046) — la représentation interne
 * normalisée de l'intention d'un système Enistere.
 *
 * Le CSM est l'UNIQUE modèle d'intention consommé par la Factory après
 * l'ingestion. Il est complet : tout ce dont le resolver, le planner et le
 * générateur ont besoin en découle, de sorte qu'aucune couche ne relit le
 * blueprint brut. Il est typé, profondément immuable et déterministe.
 *
 * Ce module possède la FORME uniquement (registres, fabriques, sérialisation +
 * digest). Il est PUR (n'importe pas le moteur) : les règles kind→runtime vivent
 * dans `engine/topologies.mjs` et sont appliquées par l'ingestion
 * (`factory/blueprint/`).
 */

import { createHash } from 'node:crypto';
import { deepFreeze } from './immutable.mjs';
export {
  BACKEND_STYLES,
  CLIENT_MODES,
  COMMUNICATION_MODES,
  DATA_OWNERSHIP_MODES,
  DEPLOYMENT_COUPLINGS,
  OPERATIONS_MATURITY_LEVELS,
  SYSTEM_PROFILES,
} from './system-profiles.mjs';

/** Version propre du CSM (distincte de la version de schéma du blueprint). */
export const SYSTEM_API_VERSION = 'enistere.io/v1alpha1';

/** Kinds d'application modélisés par le CSM minimal. */
export const APPLICATION_KINDS = Object.freeze(['api', 'web', 'mobile']);

/** Runtimes reconnus (les sept runtimes Foundation). */
export const RUNTIMES = Object.freeze(['nestjs', 'spring', 'fastapi', 'nextjs', 'angular', 'react-native', 'flutter']);

/** Kinds d'environnement reconnus. */
export const ENVIRONMENT_KINDS = Object.freeze(['local', 'staging', 'production']);

/**
 * Sérialisation récursive avec clés d'objet triées : un même modèle se sérialise
 * toujours à l'identique. L'ordre des tableaux est préservé (sémantique, construit
 * de façon déterministe). Aucun timestamp, chemin absolu ni aléatoire.
 */
export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

/** sha256 stable d'une valeur via la sérialisation canonique. */
export function stableDigest(value) {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
}

/** Une application canonique. L'intention `consumes` est conservée ici (résolue par le resolver). */
export function canonicalApplication({ id, kind, runtime, consumes = [], options = {} }) {
  return { id, kind, runtime, consumes: [...consumes], options: { ...options } };
}

/** Une capability canonique avec ses targets d'INTENTION (résolues par le resolver). */
export function canonicalCapability({ id, version, requestedTargets = [], configuration = {} }) {
  const capability = { id, requestedTargets: [...requestedTargets], configuration: { ...configuration } };
  if (version !== undefined) capability.version = version;
  return capability;
}

/** Un environnement canonique. */
export function canonicalEnvironment({ id, kind }) {
  return { id, kind };
}

/**
 * Assemble un CanonicalSystem profondément immuable et estampille `source.digest`
 * (sha256 stable du modèle, le champ digest exclu de son propre calcul).
 */
export function canonicalSystem({ metadata, architecture, applications, capabilities, domain = { entities: [] }, environments, policies = {}, source }) {
  const base = {
    apiVersion: SYSTEM_API_VERSION,
    metadata: { ...metadata },
    architecture: {
      ...architecture,
      clients: { ...architecture.clients },
      backend: { ...architecture.backend },
      deployment: { ...architecture.deployment },
      data: { ...architecture.data },
      communication: { ...architecture.communication },
      operations: { ...architecture.operations },
    },
    applications: applications.map((app) => canonicalApplication(app)),
    capabilities: capabilities.map((capability) => canonicalCapability(capability)),
    domain: { entities: [...(domain.entities ?? [])] },
    environments: environments.map((environment) => canonicalEnvironment(environment)),
    policies: { ...policies },
    source: { ...source },
  };
  const digest = stableDigest({ ...base, source: { ...source, digest: undefined } });
  base.source = { ...source, digest };
  return deepFreeze(base);
}

/** Sérialisation déterministe d'un CSM. */
export function serializeCanonicalSystem(system) {
  return stableStringify(system);
}
