/**
 * Blueprint ingestion — normalizes the current blueprint into the Canonical
 * System Model (ADR-045).
 *
 * This is a PURE translation: it maps the accepted blueprint (either the
 * single-surface `stack` sugar or the canonical `applications[]` form) to the CSM
 * without introducing any new implicit business decision. The two blueprint
 * surfaces resolve to the SAME model. Support/`not-applicable` resolution stays in
 * the existing capability engine (transitional, documented in ADR-045).
 *
 * It reuses `engine/applications.mjs` for the authoritative surface resolution, so
 * a stack blueprint and its `applications[]` equivalent normalize identically.
 */

import { resolveApplications } from '../engine/applications.mjs';
import {
  canonicalApplication,
  canonicalCapability,
  canonicalEnvironment,
  canonicalSystem,
} from '../model/canonical-system.mjs';

/**
 * Maps the blueprint architecture style to a CSM style. The current blueprint
 * declares `monolith | modular-monolith | microservices` (optional). `standard`
 * is the default; `microservices` maps to the reserved CSM style, which the
 * validator refuses — the model never silently downgrades an unsupported style.
 */
function architectureStyle(blueprint) {
  switch (blueprint.architecture?.style) {
    case 'modular-monolith': return 'modular-monolith';
    case 'microservices': return 'microservices';
    case 'monolith':
    case undefined: return 'standard';
    default: return blueprint.architecture.style; // unknown → validator reports it
  }
}

/**
 * The consumption edges of an application. An explicit `consumes` on the
 * canonical blueprint form is honored; otherwise every non-API application
 * consumes the API application(s) — the only edge the current model expresses.
 */
function consumesFor(app, declaredById, apiIds) {
  const declared = declaredById.get(app.id)?.consumes;
  if (Array.isArray(declared)) return [...declared];
  return app.kind === 'api' ? [] : [...apiIds];
}

/**
 * Normalizes a validated blueprint into a CanonicalSystem. `file` and `profile`
 * are recorded in `source` for traceability; nothing on disk is read.
 */
export function normalizeBlueprint(blueprint, { file } = {}) {
  const resolved = resolveApplications(blueprint);
  const declaredById = new Map((blueprint.applications ?? []).map((app) => [app.id, app]));
  const apiIds = resolved.filter((app) => app.kind === 'api').map((app) => app.id);
  const capabilityIds = [...blueprint.capabilities];

  const applications = resolved.map((app) => canonicalApplication({
    id: app.id,
    kind: app.kind,
    runtime: app.runtime,
    consumes: consumesFor(app, declaredById, apiIds),
    // Blueprint capabilities are global: every application carries the selection.
    // Per-target support/not-applicable stays resolved by the capability engine.
    capabilities: [...capabilityIds],
    options: {},
  }));

  const applicationIds = applications.map((app) => app.id);
  const capabilities = capabilityIds.map((id) => canonicalCapability({
    id,
    // Targets are the applications the capability is requested for (the whole
    // system today). Version/configuration are absent from the v1 blueprint.
    targets: [...applicationIds],
    configuration: {},
  }));

  const environments = [...(blueprint.deployment?.environments ?? [])].map((id) =>
    canonicalEnvironment({ id, kind: id }));

  const source = { blueprintVersion: blueprint.version };
  if (file !== undefined) source.file = file;
  if (blueprint.profile !== undefined) source.profile = blueprint.profile;

  return canonicalSystem({
    metadata: { name: blueprint.project.slug, version: '1.0.0' },
    architecture: { style: architectureStyle(blueprint) },
    applications,
    capabilities,
    environments,
    policies: {},
    source,
  });
}
