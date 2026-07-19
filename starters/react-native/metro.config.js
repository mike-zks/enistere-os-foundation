// Metro configuration.
//
// `expo/metro-config` auto-detects an npm workspace root and configures
// `watchFolders` / `resolver.nodeModulesPaths` accordingly — so this starter
// works both standalone and when the Factory materializes it at
// `<project>/apps/mobile` inside the generated unified workspace (where the
// `@enistere/*` packages are workspace members). No manual monorepo override is
// added (overriding would drop Expo's defaults; see `expo-doctor`).
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Honour the `@enistere` packages' ESM "exports" maps (import-only entry points)
// so Metro resolves their built `dist` when the Auth capability is composed.
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['react-native', 'import', 'require', 'default'];

module.exports = config;
