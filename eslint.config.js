// ESLint v10 flat config — shared across all workspaces.
//
// We deliberately don't pull in `eslint-plugin-react`: its latest stable
// (7.37.5) still calls `context.getFilename()`, which was removed in
// ESLint 10, so it throws on load. Most rules in `react/recommended` are
// either obsolete (React 19 has no PropTypes / classic JSX runtime) or
// already covered by TypeScript's strict mode. The two plugins that *do*
// matter — react-hooks and react-refresh — work fine with ESLint 10.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'storybook-static/',
      'playwright-report/',
      'test-results/',
      'coverage/',
      '**/*.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  }
);
