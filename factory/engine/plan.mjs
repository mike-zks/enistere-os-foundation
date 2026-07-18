export function buildGenerationPlan(blueprint) {
  const directories = ['apps/api', 'packages/contracts', 'capabilities', 'infrastructure/local', 'docs'];
  if (blueprint.stack.web) directories.push('apps/web');
  if (blueprint.stack.mobile) directories.push('apps/mobile');
  if (blueprint.deployment.environments.includes('staging')) directories.push('infrastructure/staging');
  return {
    project: blueprint.project.slug,
    generationMode: 'baseline-copy',
    bundledFeaturesMayExceedSelection: true,
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
