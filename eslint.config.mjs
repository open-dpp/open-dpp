// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';

// A single flat config for the whole monorepo (backend + frontend Vue client)
export default tseslint.config(
  // Global ignores
  {
    ignores: ['eslint.config.mjs'],
  },

  // Base JS/TS recommendations
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  // Vue SFC essentials (applies to all .vue files in the repo)
  ...pluginVue.configs['flat/essential'],

  // Prettier integration
  eslintPluginPrettierRecommended,

  // Default language options for backend (Node + Jest)
  {
    files: ['**/*.{js,cjs,mjs,ts,tsx}'],
    ignores: ['apps/main/client/**'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Frontend (Vue client) language options
  {
    files: ['apps/main/client/**/*.{js,mjs,cjs,ts,tsx,vue}'],
    languageOptions: {
      globals: globals.browser,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Ensure .vue <script> blocks use the TS parser in the client and align rules
  {
    files: ['apps/main/client/**/*.vue'],
    languageOptions: {
      parserOptions: {
        // Use @typescript-eslint/parser for <script lang="ts"> inside .vue files
        parser: tseslint.parser,
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },

  // Common rules
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/unbound-method': 'warn',
      '@typescript-eslint/await-thenable': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      'no-useless-escape': 'warn',
    },
  },
);