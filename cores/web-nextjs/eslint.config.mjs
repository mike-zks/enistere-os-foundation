// ESLint flat config (ESLint 9). `eslint-config-next` v16 expose une config plate native
// (tableau `Linter.Config[]`) — pas besoin de FlatCompat. `next lint` est retiré en Next 16 :
// le lint passe par l'ESLint CLI (`eslint .`).
import next from "eslint-config-next";

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...next,
  {
    ignores: [
      ".next/**",
      "build-test/**",
      "node_modules/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
