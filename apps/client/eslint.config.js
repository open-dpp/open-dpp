import rootConfig from '../../eslint.config.mjs';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Delegate to the monorepo root ESLint config and add local adjustments so
// running `npm run lint` inside this package behaves the same as running from root.
/** @type {import('eslint').Linter.Config[]} */
export default [
  // Use the root configuration (covers Vue + Prettier + TS rules)
  ...rootConfig,
  // Ensure browser globals and ESM are set when linting locally in this package
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,vue}'],
    languageOptions: {
      globals: globals.browser,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
      },
    },
  },
  // Ensure Vue SFCs use the TS parser here as well
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
];
