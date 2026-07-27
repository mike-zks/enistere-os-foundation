/**
 * Architecture Resolver (ADR-046) — turns a Canonical System Model into a
 * ResolvedSystem. It is the ONLY layer that computes resolution: runtime
 * adapters, resolved capability targets, dependencies, gates and support level.
 *
 * `resolveSystem(csm, registry)` takes ONLY a CSM (never a blueprint or a legacy
 * profile) and a registry context (loaded starter manifests, capability manifests
 * and the modular starter ids). Capability targets are computed here — the
 * normalizer only records the requested intent.
 */

import { adapterVersionsFor, getTargetAdapter } from './target-adapters.mjs';
import {
  assessCapabilitySupport,
  buildCapabilityMatrix,
  resolveCapabilityGraph,
} from './capabilities.mjs';
import { matchProfileSelection } from './profiles.mjs';
import { RESOLUTION_DIAGNOSTIC_CODES as RC, diagnostic } from '../model/diagnostics.mjs';
import { resolvedSystem } from '../model/resolved-system.mjs';
import { SYSTEM_PROFILE_DEFINITIONS } from '../model/system-profiles.mjs';
import { assessDistributedPlatformSupport } from './architecture-support.mjs';

const GATE_COMMANDS = ['install', 'test', 'build', 'verify'];
const SLOTS = ['api', 'web', 'mobile'];

/** Resolves a CSM into a ResolvedSystem against the registry context. */
export function resolveSystem(csm, { starters, capabilityManifests, modularStarters }) {
  const diagnostics = [];
  const architectureBlockers = [];
  const apps = csm.applications;
  const apiCount = apps.filter((app) => app.kind === 'api').length;
  const runtimes = [...new Set(apps.map((app) => app.runtime))];
  const modular = new Set(modularStarters);
  const allModular = runtimes.every((runtime) => modular.has(runtime));
  const generationMode = allModular ? 'modular-overlay' : 'baseline-copy';

  const starterById = new Map(starters.map((starter) => [starter.id, starter]));
  const sourceFor = (runtime) => `starters/${runtime}`;
  const adapterVersions = adapterVersionsFor(runtimes);

  // Slot view (first app of each slot) — descriptive, for profile lookup and lock.
  const stack = { api: null, web: null, mobile: null };
  for (const app of apps) if (SLOTS.includes(app.kind) && stack[app.kind] === null) stack[app.kind] = app.runtime;

  const requestedCapabilityIds = csm.capabilities.map((capability) => capability.id);
  const capabilityGraph = capabilityManifests.length > 0
    ? resolveCapabilityGraph(requestedCapabilityIds, capabilityManifests)
    : {
      requested: [...requestedCapabilityIds],
      order: [...requestedCapabilityIds],
      autoIncluded: [],
      edges: [],
      issues: [],
    };
  const capabilityIds = capabilityGraph.order;
  for (const issue of capabilityGraph.issues) {
    const code = issue.startsWith('capability conflict')
      ? RC.CAPABILITY_CONFLICT
      : RC.CAPABILITY_DEPENDENCY;
    diagnostics.push(diagnostic(code, issue, { path: 'capabilities' }));
  }

  const manifestById = new Map(capabilityManifests.map((manifest) => [manifest.id, manifest]));
  const selectedManifests = capabilityIds.map((id) => manifestById.get(id)).filter(Boolean);
  const support = assessCapabilitySupport(runtimes, selectedManifests);
  for (const blocker of support.blockers) {
    diagnostics.push(diagnostic(RC.CAPABILITY_NOT_READY, `${blocker.capability} on ${blocker.starter} is ${blocker.status}`, { details: blocker }));
  }
  const systemProfile = SYSTEM_PROFILE_DEFINITIONS[csm.architecture.profile];
  const distributedSupport = csm.architecture.profile === 'distributed-platform'
    ? assessDistributedPlatformSupport(csm)
    : null;
  if (apiCount > 1 && !distributedSupport?.generatable) {
    const blocker = {
      kind: 'topology',
      apiCount,
      status: 'PLANNED',
      reason: distributedSupport?.reasons.join('; ')
        ?? 'multiple backend applications are not materializable for this profile',
      scope: distributedSupport?.scope,
    };
    architectureBlockers.push(blocker);
    diagnostics.push(diagnostic(
      RC.TOPOLOGY_NOT_GENERATABLE,
      `${apiCount} backend applications are representable but outside the proven generation scope`,
      { path: 'applications', details: blocker },
    ));
  }
  if (systemProfile?.generation === 'PLANNED') {
    const blocker = {
      kind: 'architecture-profile',
      profile: csm.architecture.profile,
      status: systemProfile.generation,
      reason: systemProfile.generationScope,
    };
    architectureBlockers.push(blocker);
    diagnostics.push(diagnostic(
      RC.ARCHITECTURE_PROFILE_NOT_GENERATABLE,
      `system profile ${csm.architecture.profile} is representable but not generatable`,
      { path: 'architecture.profile', details: blocker },
    ));
  }

  const matrix = buildCapabilityMatrix(selectedManifests);
  const composable = (status) => status === 'ready' || status === 'not-applicable';
  const csmCapabilityById = new Map(csm.capabilities.map((capability) => [capability.id, capability]));
  const targetsByCapability = new Map(capabilityIds.map((id) => [
    id,
    new Set(csmCapabilityById.get(id)?.requestedTargets ?? []),
  ]));
  // Dependency-first order reversed means a dependent propagates its requested
  // application targets to its requirements before those requirements resolve.
  for (const id of [...capabilityIds].reverse()) {
    for (const edge of capabilityGraph.edges.filter((candidate) => candidate.from === id)) {
      const dependencyTargets = targetsByCapability.get(edge.to);
      for (const target of targetsByCapability.get(id) ?? []) dependencyTargets?.add(target);
    }
  }
  const requiredBy = Object.fromEntries(capabilityIds.map((id) => [
    id,
    capabilityGraph.edges.filter((edge) => edge.to === id).map((edge) => edge.from).sort(),
  ]));

  const targetResolution = (manifest, runtimeId, status) => {
    if (!manifest) return { status };
    const target = manifest.targets[runtimeId];
    if (target.status === 'not-applicable') return { status: target.status };
    if (target.status !== 'ready') return { status: target.status };
    const definitions = (ids, items) => ids.map((id) => ({ ...items.find((item) => item.id === id) }));
    return {
      status: target.status,
      mode: target.mode,
      adapter: { ...target.adapter },
      deploymentModes: [...target.deploymentModes],
      contracts: definitions(target.contracts, manifest.contracts),
      primitives: definitions(target.primitives, manifest.primitives),
      migrations: definitions(target.migrations, manifest.migrations),
      conformance: definitions(target.conformance, manifest.conformance),
    };
  };

  const applications = apps.map((app) => {
    if (!getTargetAdapter(app.runtime)) {
      diagnostics.push(diagnostic(RC.UNKNOWN_RUNTIME_ADAPTER, `no runtime adapter for ${app.runtime}`, { details: { runtime: app.runtime } }));
    }
    const starter = starterById.get(app.runtime);
    const gates = GATE_COMMANDS
      .filter((command) => starter?.commands?.[command])
      .map((command) => ({ gate: command, command: starter.commands[command].join(' ') }));
    const resolvedCapabilities = capabilityIds
      .filter((id) => targetsByCapability.get(id)?.has(app.id))
      .map((id) => ({
        id,
        inclusion: capabilityGraph.autoIncluded.includes(id) ? 'dependency' : 'requested',
        ...targetResolution(manifestById.get(id), app.runtime, matrix[id]?.[app.runtime]),
      }))
      .filter((capability) => composable(capability.status));
    return {
      id: app.id,
      kind: app.kind,
      runtime: app.runtime,
      adapter: adapterVersions[app.runtime] ?? null,
      baseline: {
        contractVersion: starter?.baseline?.contractVersion ?? null,
        familyContract: starter?.baseline?.familyContract ?? null,
      },
      source: sourceFor(app.runtime),
      appDir: `apps/${app.id}`,
      gates,
      resolvedCapabilities,
      consumes: [...app.consumes],
      ownership: app.ownership
        ? { team: app.ownership.team, domains: [...app.ownership.domains] }
        : null,
    };
  });

  const runtimeById = new Map(apps.map((app) => [app.id, app.runtime]));
  const appIds = apps.map((app) => app.id);
  const capabilities = capabilityIds.map((id) => {
    const intentTargets = [...(targetsByCapability.get(id) ?? [])];
    const manifest = manifestById.get(id);
    const resolvedTargets = intentTargets.filter((appId) =>
      composable(matrix[id]?.[runtimeById.get(appId)]));
    const notApplicableTargets = intentTargets.filter((appId) =>
      matrix[id]?.[runtimeById.get(appId)] === 'not-applicable');
    // Only diagnose an unresolvable capability when its manifest was provided
    // (i.e. it exists in the matrix): planner unit tests resolve without manifests.
    if (matrix[id] && resolvedTargets.length === 0 && intentTargets.length > 0) {
      diagnostics.push(diagnostic(RC.NO_VALID_TARGET, `capability ${id} resolves to no valid target`, { details: { capability: id } }));
    }
    return {
      id,
      version: manifest?.version ?? csmCapabilityById.get(id)?.version ?? null,
      inclusion: capabilityGraph.autoIncluded.includes(id) ? 'dependency' : 'requested',
      requiredBy: requiredBy[id],
      requires: [...(manifest?.requires ?? [])],
      configuration: { ...(csmCapabilityById.get(id)?.configuration ?? {}) },
      requestedTargets: intentTargets,
      resolvedTargets,
      notApplicableTargets,
      targetResolutions: Object.fromEntries(intentTargets.map((appId) => [
        appId,
        targetResolution(manifest, runtimeById.get(appId), matrix[id]?.[runtimeById.get(appId)]),
      ])),
    };
  });

  // A composition preset describes exactly one application per historical
  // api/web/mobile slot. Never attach a single-stack preset to a multi-surface
  // or distributed system merely because its first applications happen to
  // match the preset.
  const selectedSlotCount = Object.values(stack).filter(Boolean).length;
  const presetEligible = apps.length === selectedSlotCount
    && SLOTS.every((kind) => apps.filter((app) => app.kind === kind).length <= 1);
  const matched = presetEligible ? matchProfileSelection(stack, capabilityIds) : null;
  const compositionPreset = matched
    ? { id: matched.id, status: matched.status, golden: matched.golden, runtimeProven: Boolean(matched.golden), compositionExact: allModular }
    : null;
  const architectureProfile = {
    id: csm.architecture.profile,
    status: systemProfile?.status ?? 'TARGET',
    representation: systemProfile?.representation ?? 'TARGET',
    generation: systemProfile?.generation ?? 'PLANNED',
    generationScope: systemProfile?.generationScope ?? 'no registered support',
    generatable: systemProfile?.generation === 'GENERATABLE' && architectureBlockers.length === 0,
  };

  return resolvedSystem({
    metadata: csm.metadata,
    architecture: csm.architecture,
    applications,
    capabilities,
    communications: csm.communications,
    domain: csm.domain,
    environments: csm.environments,
    policies: csm.policies,
    selection: { runtimes, stack, allModular, generationMode, targetAdapters: adapterVersions },
    capabilityGraph: {
      requested: [...capabilityGraph.requested],
      order: [...capabilityGraph.order],
      autoIncluded: [...capabilityGraph.autoIncluded],
      edges: capabilityGraph.edges.map((edge) => ({ ...edge })),
    },
    architectureProfile,
    compositionPreset,
    support: {
      level: support.ready && architectureBlockers.length === 0 && capabilityGraph.issues.length === 0
        ? 'ready'
        : 'blocked',
      blockers: [...support.blockers, ...architectureBlockers],
      notApplicable: support.notApplicable,
    },
    diagnostics,
    systemDigest: csm.source.digest,
  });
}
