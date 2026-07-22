import { matchProfile } from './profiles.mjs';
import { selectedStarterIds } from './starters.mjs';
import { adapterVersionsFor } from './target-adapters.mjs';
import { resolveApplications, resolveStack } from './applications.mjs';
import { normalizeBlueprint } from '../blueprint/normalize.mjs';
import { validateCanonicalSystem } from '../blueprint/validate.mjs';
import { errors, formatDiagnostics, hasErrors } from '../model/diagnostics.mjs';

/** Gates a generated app runs, in the order a verification pass applies them. */
const GATE_COMMANDS = Object.freeze(['install', 'test', 'build', 'verify']);

/**
 * Expected gates per app slot, read from the starter manifests so the plan
 * reports the commands the generated project will actually run.
 */
export function expectedGates(blueprint, starters) {
  const byId = new Map(starters.map((starter) => [starter.id, starter]));
  const gates = {};
  // Keyed by application id; for the single-surface sugar the id is the slot
  // (api/web/mobile), so the shape is unchanged.
  for (const app of resolveApplications(blueprint)) {
    const starter = byId.get(app.runtime);
    if (!starter) continue;
    gates[app.id] = GATE_COMMANDS
      .filter((command) => starter.commands[command])
      .map((command) => ({ gate: command, command: starter.commands[command].join(' ') }));
  }
  return gates;
}

/**
 * Builds the generation plan. `modularStarters` lists the starter ids whose
 * baseline follows the modular composition contract (base-only sources plus
 * declarative capability overlays). When every selected starter is modular the
 * generation is a true modular overlay composition: the output contains exactly
 * the selected capabilities. Otherwise the legacy baseline copy applies and
 * bundled starter features may exceed the selection.
 *
 * `starters` supplies the manifests used to report the expected gates.
 */
export function buildGenerationPlan(blueprint, { modularStarters = [], starters = [] } = {}) {
  // The blueprint is normalized to the Canonical System Model (ADR-045) and the
  // model is validated before planning: the planner consumes the CSM, never the
  // raw blueprint's application shape. Output stays byte-identical to the legacy
  // path (the CSM applications are the resolved blueprint applications).
  const system = normalizeBlueprint(blueprint);
  const diagnostics = validateCanonicalSystem(system);
  if (hasErrors(diagnostics)) {
    throw new Error(`Invalid canonical system:\n- ${errors(diagnostics).map((d) => formatDiagnostics([d])).join('\n- ')}`);
  }

  const stack = resolveStack(blueprint);
  const modular = new Set(modularStarters);
  const allModular = selectedStarterIds(blueprint).every((starterId) => modular.has(starterId));
  // A blueprint need not claim a profile; when its selection matches one, the
  // plan names it so the composition is traceable to a supported combination.
  const matched = matchProfile(blueprint);
  const starterById = new Map(starters.map((starter) => [starter.id, starter]));
  const sourceFor = (starterId) => starterById.get(starterId)?.composition?.baseSource ?? `starters/${starterId}`;
  const selectedTargets = selectedStarterIds(blueprint);

  // Canonical per-application plan, derived from the CSM. For the single-surface
  // sugar each app id IS its slot (api/web/mobile), so `apps/<id>` and
  // starterSources stay identical.
  const applications = system.applications.map((app) => ({
    id: app.id,
    kind: app.kind,
    runtime: app.runtime,
    source: sourceFor(app.runtime),
    appDir: `apps/${app.id}`,
  }));

  // Directory order preserved for byte-identical output: the API app dir(s)
  // first, then the fixed dirs, then the other app dirs, then optional staging.
  const apiDirs = applications.filter((app) => app.kind === 'api').map((app) => app.appDir);
  const otherDirs = applications.filter((app) => app.kind !== 'api').map((app) => app.appDir);
  const directories = [...apiDirs, 'packages/contracts', 'capabilities', 'infrastructure/local', 'docs', ...otherDirs];
  if (blueprint.deployment.environments.includes('staging')) directories.push('infrastructure/staging');

  return {
    project: blueprint.project.slug,
    generationMode: allModular ? 'modular-overlay' : 'baseline-copy',
    bundledFeaturesMayExceedSelection: !allModular,
    stack,
    targetAdapters: adapterVersionsFor(selectedTargets),
    capabilities: [...blueprint.capabilities],
    // `runtimeProven` says a golden exercises this selection; `compositionExact`
    // says the generated project carries nothing beyond it. A profile is `ready`
    // only when both hold — a baseline-copy profile can be proven yet deliver
    // capabilities that were never selected.
    profile: matched
      ? {
        id: matched.id,
        status: matched.status,
        golden: matched.golden,
        runtimeProven: Boolean(matched.golden),
        compositionExact: allModular,
      }
      : null,
    gates: expectedGates(blueprint, starters),
    designSystem: blueprint.designSystem,
    directories,
    applications,
    // Derived from applications (id -> source); byte-identical for the sugar.
    starterSources: Object.fromEntries(applications.map((app) => [app.id, app.source])),
  };
}
