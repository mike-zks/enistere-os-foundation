// ESLint flat config — Expo preset (https://docs.expo.dev/guides/using-eslint/).
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  expoConfig,
  {
    // Node-based unit tests (run via `node --test`): allow Node globals.
    files: ['test/**/*.ts'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        globalThis: 'readonly',
      },
    },
  },
  {
    ignores: ['dist/*', '.expo/*', 'build-test/*', 'node_modules/*'],
  },
].flat();
