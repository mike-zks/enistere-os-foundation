// ESLint flat config — Expo preset (https://docs.expo.dev/guides/using-eslint/).
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*'],
  },
].flat();
