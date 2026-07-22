/**
 * Blueprint ingestion — normalizes the current blueprint into the complete
 * Canonical System Model (ADR-045, ADR-046).
 *
 * This is the ONLY layer that reads the raw blueprint. It maps the accepted
 * blueprint (single-surface `stack` sugar OR canonical `applications[]`) to a
 * complete CSM — metadata, architecture, applications, capabilities with their
 * requested targets, domain, environments and policies — so that no downstream
 * layer needs the blueprint. Pure translation, no new implicit business decision.
 */

import { resolveApplications } from '../engine/applications.mjs';
import {
  canonicalApplication,
  canonicalCapability,
  canonicalEnvironment,
  canonicalSystem,
} from '../model/canonical-system.mjs';

/**
 * Maps the blueprint architecture style to a CSM style. `standard` is the
 * default; `microservices` maps to the reserved CSM style, which the validator
 * refuses — the model never silently downgrades an unsupported style.
 */
function architectureStyle(blueprint) {
  switch (blueprint.architecture?.style) {
    case 'modular-monolith': return 'modular-monolith';
    case 'microservices': return 'microservices';
    case 'monolith':
    case undefined: return 'standard';
    default: return blueprint.architecture.style;
  }
}

/**
 * Requested consumption edges. An explicit `consumes` on the canonical blueprint
 * form is honored; otherwise every non-API application requests the API(s) — the
 * only intent the current model expresses. Resolution happens in the resolver.
 */
function consumesFor(app, declaredById, apiIds) {
  const declared = declaredById.get(app.id)?.consumes;
  if (Array.isArray(declared)) return [...declared];
  return app.kind === 'api' ? [] : [...apiIds];
}

/** Normalizes a validated blueprint into a complete CanonicalSystem. */
export function normalizeBlueprint(blueprint, { file } = {}) {
  const resolved = resolveApplications(blueprint);
  const declaredById = new Map((blueprint.applications ?? []).map((app) => [app.id, app]));
  const apiIds = resolved.filter((app) => app.kind === 'api').map((app) => app.id);
  const applicationIds = resolved.map((app) => app.id);

  const applications = resolved.map((app) => canonicalApplication({
    id: app.id,
    kind: app.kind,
    runtime: app.runtime,
    consumes: consumesFor(app, declaredById, apiIds),
    options: {},
  }));

  // Global blueprint capabilities → CSM capabilities whose requested targets are
  // the whole system. The resolver narrows them to the effective per-target
  // support; this layer only records the user intent.
  const capabilities = [...blueprint.capabilities].map((id) => canonicalCapability({
    id,
    requestedTargets: [...applicationIds],
    configuration: {},
  }));

  const environments = [...(blueprint.deployment?.environments ?? [])].map((id) =>
    canonicalEnvironment({ id, kind: id }));

  const source = { blueprintVersion: blueprint.version };
  if (file !== undefined) source.file = file;
  if (blueprint.profile !== undefined) source.profile = blueprint.profile;

  return canonicalSystem({
    metadata: { name: blueprint.project.slug, displayName: blueprint.project.name, version: '1.0.0' },
    architecture: { style: architectureStyle(blueprint) },
    applications,
    capabilities,
    domain: { entities: [...(blueprint.domain?.entities ?? [])] },
    environments,
    policies: { designSystem: Boolean(blueprint.designSystem) },
    source,
  });
}
