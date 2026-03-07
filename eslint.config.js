import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.next/**', '**/.turbo/**'],
  },

  // Base config for all TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [tseslint.configs.base],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // GP-03: No console.log — use structured logger
      'no-console': ['error', { allow: ['warn', 'error'] }],

      // Clean code basics
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
    },
  },

  // Frontend files get browser globals
  {
    files: ['packages/web/**/*.ts', 'packages/web/**/*.tsx'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // Allow console in frontend for now (will switch to structured logging in v2)
      'no-console': 'off',
    },
  },

  // Test files
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      'no-console': 'off',
    },
  },
);
