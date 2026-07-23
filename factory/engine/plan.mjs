/**
 * Composition entry point (ADR-046) — the single canonical pipeline.
 *
 * `buildGenerationPlan` orchestrates the layers in order and returns a
 * GenerationPlan. The blueprint is consumed ONLY by the ingestion layer
 * (`normalizeBlueprint`); the resolver receives a CSM and the planner receives a
 * ResolvedSystem. No downstream layer reads the raw blueprint.
 *
 *   blueprint → normalize → CSM → validate → resolve → ResolvedSystem → plan
 *
 * `capabilityManifests` is the registry context for target/support resolution.
 * It is optional for planner unit tests (which do not assert resolved targets);
 * the CLI and the generator always provide it.
 */

import { normalizeBlueprint } from '../blueprint/normalize.mjs';
import { validateCanonicalSystem } from '../blueprint/validate.mjs';
import { resolveSystem } from './resolver.mjs';
import { buildPlan } from '../model/generation-plan.mjs';
import { errors, formatDiagnostics, hasErrors } from '../model/diagnostics.mjs';

/** Normalizes, validates, resolves and plans a blueprint through the canonical pipeline. */
export function buildGenerationPlan(blueprint, { modularStarters = [], starters = [], capabilityManifests = [] } = {}) {
  const system = normalizeBlueprint(blueprint);
  const csmDiagnostics = validateCanonicalSystem(system);
  if (hasErrors(csmDiagnostics)) {
    throw new Error(`Invalid canonical system:\n- ${errors(csmDiagnostics).map((d) => formatDiagnostics([d])).join('\n- ')}`);
  }
  const resolved = resolveSystem(system, { starters, capabilityManifests, modularStarters });
  return buildPlan(resolved);
}
