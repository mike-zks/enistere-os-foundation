/**
 * Resolved System Model (ADR-046) — the UNIQUE resolution model of the Factory.
 *
 * The resolver turns an intent (CSM) into a resolved system: runtime adapters,
 * resolved capability targets, dependencies, gates and support level. It is a
 * distinct, immutable, deterministic artifact — never the CSM overloaded with
 * resolution data. The planner consumes only a ResolvedSystem.
 *
 * Digest layering: `systemDigest` (the CSM digest) is carried through, and
 * `resolutionDigest` covers the resolution itself (CSM digest + resolved
 * components, versions, targets, dependencies).
 */

import { stableDigest, stableStringify } from './canonical-system.mjs';
import { deepFreeze } from './immutable.mjs';

/**
 * Assembles a deeply immutable ResolvedSystem and stamps its `resolutionDigest`
 * (stable sha256 over the resolution, its own digest excluded).
 */
export function resolvedSystem({
  metadata, architecture, applications, capabilities, communications, domain, environments, policies,
  selection, capabilityGraph, architectureProfile, compositionPreset, support, diagnostics, systemDigest,
}) {
  const base = {
    metadata: { ...metadata },
    architecture: { ...architecture },
    applications: applications.map((app) => ({
      ...app,
      baseline: { ...app.baseline },
      gates: [...app.gates],
      resolvedCapabilities: [...app.resolvedCapabilities],
      consumes: [...app.consumes],
      ownership: app.ownership
        ? { team: app.ownership.team, domains: [...app.ownership.domains] }
        : null,
    })),
    capabilities: capabilities.map((capability) => ({
      ...capability,
      requiredBy: [...capability.requiredBy],
      requires: [...capability.requires],
      requestedTargets: [...capability.requestedTargets],
      resolvedTargets: [...capability.resolvedTargets],
      notApplicableTargets: [...capability.notApplicableTargets],
      targetResolutions: { ...capability.targetResolutions },
    })),
    communications: communications.map((communication) => ({ ...communication })),
    domain: { entities: [...(domain.entities ?? [])] },
    environments: environments.map((e) => ({ ...e })),
    policies: { ...policies },
    selection: { ...selection, runtimes: [...selection.runtimes], stack: { ...selection.stack } },
    capabilityGraph: {
      requested: [...capabilityGraph.requested],
      order: [...capabilityGraph.order],
      autoIncluded: [...capabilityGraph.autoIncluded],
      edges: capabilityGraph.edges.map((edge) => ({ ...edge })),
    },
    architectureProfile: { ...architectureProfile },
    compositionPreset: compositionPreset ? { ...compositionPreset } : null,
    support: { level: support.level, blockers: [...support.blockers], notApplicable: [...support.notApplicable] },
    diagnostics: [...diagnostics],
    systemDigest,
  };
  const resolutionDigest = stableDigest({ ...base, resolutionDigest: undefined });
  return deepFreeze({ ...base, resolutionDigest });
}

/** Deterministic serialization of a ResolvedSystem. */
export function serializeResolvedSystem(system) {
  return stableStringify(system);
}
