import { selectedStarterIds } from './starters.mjs';

/**
 * Builds the generation plan. `modularStarters` lists the starter ids whose
 * baseline follows the modular composition contract (base-only sources plus
 * declarative capability overlays). When every selected starter is modular the
 * generation is a true modular overlay composition: the output contains exactly
 * the selected capabilities. Otherwise the legacy baseline copy applies and
 * bundled starter features may exceed the selection.
 */
export function buildGenerationPlan(blueprint, { modularStarters = [] } = {}) {
  const directories = ['apps/api', 'packages/contracts', 'capabilities', 'infrastructure/local', 'docs'];
  if (blueprint.stack.web) directories.push('apps/web');
  if (blueprint.stack.mobile) directories.push('apps/mobile');
  if (blueprint.deployment.environments.includes('staging')) directories.push('infrastructure/staging');
  const modular = new Set(modularStarters);
  const allModular = selectedStarterIds(blueprint).every((starterId) => modular.has(starterId));
  return {
    project: blueprint.project.slug,
    generationMode: allModular ? 'modular-overlay' : 'baseline-copy',
    bundledFeaturesMayExceedSelection: !allModular,
    stack: blueprint.stack,
    capabilities: [...blueprint.capabilities],
    designSystem: blueprint.designSystem,
    directories,
    starterSources: {
      api: `starters/${blueprint.stack.api}`,
      ...(blueprint.stack.web ? { web: `starters/${blueprint.stack.web}` } : {}),
      ...(blueprint.stack.mobile ? { mobile: `starters/${blueprint.stack.mobile}` } : {}),
    },
  };
}
