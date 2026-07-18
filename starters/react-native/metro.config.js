// Metro configuration for the autonomous mobile core (RN 4).
//
// The core keeps its OWN lockfile and is NOT a root npm workspace (preserving
// the "cores restent autonomes" architecture). The two official packages
// `@enistere/api-contracts` and `@enistere/api-client-fetch` are linked via
// `file:` dependencies, so their real source lives OUTSIDE the project root.
// Metro therefore needs the monorepo packages added to `watchFolders` to follow
// the symlinks and resolve/serve their built ESM `dist`.
const path = require('path');

const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..', '..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Watch the linked monorepo packages (they live outside projectRoot).
config.watchFolders = [
  path.resolve(monorepoRoot, 'packages', 'api-contracts'),
  path.resolve(monorepoRoot, 'packages', 'api-client-fetch'),
];

// Resolve modules from the project's OWN node_modules only (autonomous install).
// Deliberately NOT adding the monorepo root node_modules: that would risk a
// duplicate React/React Native being picked up. Every runtime dependency the
// linked packages need (e.g. `openapi-fetch`) is declared directly in this core.
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];

// Honour the packages' ESM "exports" maps (dist entry points). The `@enistere`
// packages expose an `import`-only exports map, so `import` must be in the
// condition list for Metro to resolve them.
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['react-native', 'import', 'require', 'default'];

module.exports = config;
