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
  metadata, architecture, applications, capabilities, domain, environments, policies,
  selection, architectureProfile, compositionPreset, support, diagnostics, systemDigest,
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
    })),
    capabilities: capabilities.map((c) => ({ ...c })),
    domain: { entities: [...(domain.entities ?? [])] },
    environments: environments.map((e) => ({ ...e })),
    policies: { ...policies },
    selection: { ...selection, runtimes: [...selection.runtimes], stack: { ...selection.stack } },
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
