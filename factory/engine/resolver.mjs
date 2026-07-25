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
import { assessCapabilitySupport, buildCapabilityMatrix, validateCapabilityDependencies } from './capabilities.mjs';
import { matchProfileSelection } from './profiles.mjs';
import { RESOLUTION_DIAGNOSTIC_CODES as RC, diagnostic } from '../model/diagnostics.mjs';
import { resolvedSystem } from '../model/resolved-system.mjs';

const GATE_COMMANDS = ['install', 'test', 'build', 'verify'];
const SLOTS = ['api', 'web', 'mobile'];

/** Resolves a CSM into a ResolvedSystem against the registry context. */
export function resolveSystem(csm, { starters, capabilityManifests, modularStarters }) {
  const diagnostics = [];
  const apps = csm.applications;
  const runtimes = [...new Set(apps.map((app) => app.runtime))];
  const modular = new Set(modularStarters);
  const allModular = runtimes.every((runtime) => modular.has(runtime));
  const generationMode = allModular ? 'modular-overlay' : 'baseline-copy';

  const starterById = new Map(starters.map((starter) => [starter.id, starter]));
  const sourceFor = (runtime) => starterById.get(runtime)?.composition?.baseSource ?? `starters/${runtime}`;
  const adapterVersions = adapterVersionsFor(runtimes);

  // Slot view (first app of each slot) — descriptive, for profile lookup and lock.
  const stack = { api: null, web: null, mobile: null };
  for (const app of apps) if (SLOTS.includes(app.kind) && stack[app.kind] === null) stack[app.kind] = app.runtime;

  const capabilityIds = csm.capabilities.map((capability) => capability.id);
  for (const issue of validateCapabilityDependencies(capabilityIds)) {
    diagnostics.push(diagnostic(RC.CAPABILITY_DEPENDENCY, issue, { path: 'capabilities' }));
  }

  const support = assessCapabilitySupport(runtimes, capabilityManifests);
  for (const blocker of support.blockers) {
    diagnostics.push(diagnostic(RC.CAPABILITY_NOT_READY, `${blocker.capability} on ${blocker.starter} is ${blocker.status}`, { details: blocker }));
  }

  const matrix = buildCapabilityMatrix(capabilityManifests);
  const composable = (status) => status === 'ready' || status === 'not-applicable';

  const applications = apps.map((app) => {
    if (!getTargetAdapter(app.runtime)) {
      diagnostics.push(diagnostic(RC.UNKNOWN_RUNTIME_ADAPTER, `no runtime adapter for ${app.runtime}`, { details: { runtime: app.runtime } }));
    }
    const starter = starterById.get(app.runtime);
    const gates = GATE_COMMANDS
      .filter((command) => starter?.commands?.[command])
      .map((command) => ({ gate: command, command: starter.commands[command].join(' ') }));
    const resolvedCapabilities = capabilityIds
      .map((id) => ({ id, status: matrix[id]?.[app.runtime] }))
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
    };
  });

  const runtimeById = new Map(apps.map((app) => [app.id, app.runtime]));
  const appIds = apps.map((app) => app.id);
  const capabilities = csm.capabilities.map((capability) => {
    const resolvedTargets = appIds.filter((id) => composable(matrix[capability.id]?.[runtimeById.get(id)]));
    const notApplicableTargets = appIds.filter((id) => matrix[capability.id]?.[runtimeById.get(id)] === 'not-applicable');
    // Only diagnose an unresolvable capability when its manifest was provided
    // (i.e. it exists in the matrix): planner unit tests resolve without manifests.
    if (matrix[capability.id] && resolvedTargets.length === 0 && capability.requestedTargets.length > 0) {
      diagnostics.push(diagnostic(RC.NO_VALID_TARGET, `capability ${capability.id} resolves to no valid target`, { details: { capability: capability.id } }));
    }
    return { id: capability.id, configuration: { ...capability.configuration }, requestedTargets: [...capability.requestedTargets], resolvedTargets, notApplicableTargets };
  });

  const matched = matchProfileSelection(stack, capabilityIds);
  const profile = matched
    ? { id: matched.id, status: matched.status, golden: matched.golden, runtimeProven: Boolean(matched.golden), compositionExact: allModular }
    : null;

  return resolvedSystem({
    metadata: csm.metadata,
    architecture: csm.architecture,
    applications,
    capabilities,
    domain: csm.domain,
    environments: csm.environments,
    policies: csm.policies,
    selection: { runtimes, stack, allModular, generationMode, targetAdapters: adapterVersions },
    profile,
    support: { level: support.ready ? 'ready' : 'blocked', blockers: support.blockers, notApplicable: support.notApplicable },
    diagnostics,
    systemDigest: csm.source.digest,
  });
}
