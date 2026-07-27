/**
 * Generation Plan (ADR-046) — the UNIQUE input of the generator.
 *
 * `buildPlan(resolvedSystem)` produces a self-contained, deterministic,
 * deeply-immutable plan. The generator reads ONLY the plan: it carries every
 * datum the materialization needs (project identity, design system, capabilities
 * and their resolved targets, domain, environments, applications with their
 * source and gates) so no layer re-reads the blueprint. The plan holds no
 * reference to the raw blueprint.
 *
 * Digest layering: `systemDigest` (CSM) and `resolutionDigest` are carried
 * through; `planDigest` covers the plan itself.
 */

import { stableDigest, stableStringify } from './canonical-system.mjs';
import { deepFreeze } from './immutable.mjs';
import { PLAN_DIAGNOSTIC_CODES as PC, diagnostic } from './diagnostics.mjs';

/** Builds the deeply-immutable GenerationPlan from a ResolvedSystem. */
export function buildPlan(resolved) {
  const { selection } = resolved;
  const applications = resolved.applications.map((app) => ({
    id: app.id, kind: app.kind, runtime: app.runtime, baseline: { ...app.baseline }, source: app.source, appDir: app.appDir,
  }));

  const apiDirs = applications.filter((app) => app.kind === 'api').map((app) => app.appDir);
  const otherDirs = applications.filter((app) => app.kind !== 'api').map((app) => app.appDir);
  const hasStaging = resolved.environments.some((environment) => environment.id === 'staging');
  const directories = [...apiDirs, 'packages/contracts', 'capabilities', 'infrastructure/local', 'docs', ...otherDirs];
  if (hasStaging) directories.push('infrastructure/staging');

  const planDiagnostics = [];
  if (!selection.allModular) {
    planDiagnostics.push(diagnostic(
      PC.BUNDLED_FEATURES_EXCEED_SELECTION,
      'a baseline-copy starter ships its whole baseline; the generated project may exceed the selection',
      { severity: 'warning', path: 'generationMode' },
    ));
  }
  // The plan carries the resolution diagnostics too, so the generator refuses a
  // non-generatable composition from the plan alone (no blueprint, no re-resolution).
  const diagnostics = [...resolved.diagnostics, ...planDiagnostics];

  const base = {
    project: resolved.metadata.name,
    displayName: resolved.metadata.displayName,
    architecture: {
      ...resolved.architecture,
      clients: { ...resolved.architecture.clients },
      backend: { ...resolved.architecture.backend },
      deployment: { ...resolved.architecture.deployment },
      data: { ...resolved.architecture.data },
      communication: { ...resolved.architecture.communication },
      operations: { ...resolved.architecture.operations },
    },
    generationMode: selection.generationMode,
    bundledFeaturesMayExceedSelection: !selection.allModular,
    stack: { ...selection.stack },
    targetAdapters: { ...selection.targetAdapters },
    capabilities: resolved.capabilities.map((capability) => capability.id),
    capabilityTargets: Object.fromEntries(resolved.capabilities.map((capability) => [
      capability.id,
      { resolved: [...capability.resolvedTargets], notApplicable: [...capability.notApplicableTargets], configuration: { ...capability.configuration } },
    ])),
    domain: { entities: [...resolved.domain.entities] },
    designSystem: Boolean(resolved.policies.designSystem),
    environments: resolved.environments.map((environment) => ({ ...environment })),
    architectureProfile: { ...resolved.architectureProfile },
    compositionPreset: resolved.compositionPreset ? { ...resolved.compositionPreset } : null,
    // Blueprint v1 compatibility: `profile` historically means a named
    // composition preset. New consumers use `compositionPreset`.
    profile: resolved.compositionPreset ? { ...resolved.compositionPreset } : null,
    support: { level: resolved.support.level, blockers: resolved.support.blockers.map((b) => ({ ...b })), notApplicable: resolved.support.notApplicable.map((n) => ({ ...n })) },
    gates: Object.fromEntries(resolved.applications.map((app) => [app.id, app.gates.map((gate) => ({ ...gate }))])),
    directories,
    applications,
    starterSources: Object.fromEntries(applications.map((app) => [app.id, app.source])),
    diagnostics,
    systemDigest: resolved.systemDigest,
    resolutionDigest: resolved.resolutionDigest,
  };
  const planDigest = stableDigest({ ...base, planDigest: undefined });
  return deepFreeze({ ...base, planDigest });
}

/** Deterministic serialization of a GenerationPlan. */
export function serializeGenerationPlan(plan) {
  return stableStringify(plan);
}
