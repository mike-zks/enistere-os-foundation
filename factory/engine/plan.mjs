import { matchProfile } from './profiles.mjs';
import { selectedStarterIds } from './starters.mjs';
import { adapterVersionsFor } from './target-adapters.mjs';

/** Gates a generated app runs, in the order a verification pass applies them. */
const GATE_COMMANDS = Object.freeze(['install', 'test', 'build', 'verify']);

/**
 * Expected gates per app slot, read from the starter manifests so the plan
 * reports the commands the generated project will actually run.
 */
export function expectedGates(blueprint, starters) {
  const byId = new Map(starters.map((starter) => [starter.id, starter]));
  const slots = { api: blueprint.stack.api, web: blueprint.stack.web, mobile: blueprint.stack.mobile };
  const gates = {};
  for (const [slot, starterId] of Object.entries(slots)) {
    const starter = starterId ? byId.get(starterId) : null;
    if (!starter) continue;
    gates[slot] = GATE_COMMANDS
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
  const directories = ['apps/api', 'packages/contracts', 'capabilities', 'infrastructure/local', 'docs'];
  if (blueprint.stack.web) directories.push('apps/web');
  if (blueprint.stack.mobile) directories.push('apps/mobile');
  if (blueprint.deployment.environments.includes('staging')) directories.push('infrastructure/staging');
  const modular = new Set(modularStarters);
  const allModular = selectedStarterIds(blueprint).every((starterId) => modular.has(starterId));
  // A blueprint need not claim a profile; when its selection matches one, the
  // plan names it so the composition is traceable to a supported combination.
  const matched = matchProfile(blueprint);
  const starterById = new Map(starters.map((starter) => [starter.id, starter]));
  const sourceFor = (starterId) => starterById.get(starterId)?.composition?.baseSource ?? `starters/${starterId}`;
  const selectedTargets = selectedStarterIds(blueprint);
  return {
    project: blueprint.project.slug,
    generationMode: allModular ? 'modular-overlay' : 'baseline-copy',
    bundledFeaturesMayExceedSelection: !allModular,
    stack: blueprint.stack,
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
    starterSources: {
      api: sourceFor(blueprint.stack.api),
      ...(blueprint.stack.web ? { web: sourceFor(blueprint.stack.web) } : {}),
      ...(blueprint.stack.mobile ? { mobile: sourceFor(blueprint.stack.mobile) } : {}),
    },
  };
}
