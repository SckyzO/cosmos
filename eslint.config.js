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
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/storybook-static/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/coverage/**',
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
  },
  {
    // The packages are component libraries: compound components
    // (`Object.assign(Root, { Item })`) and their companion exports live in one
    // file by design, which this Fast Refresh rule flags. It only matters for
    // app code, so keep it for the Storybook app and the e2e tooling.
    files: ['packages/*/src/**/*.{ts,tsx}'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    // Storybook stories use `render: (args) => { ... useState ... }` and
    // similar inline patterns. Those arrow functions ARE valid React
    // component contexts at runtime (Storybook calls them via React.createElement),
    // but `react-hooks/rules-of-hooks` 7.x can't recognise them as components
    // because they're anonymous arrow expressions assigned to a lowercase
    // property name. Disabling the rule here keeps the stories ergonomic
    // without weakening the rule for the real component sources.
    files: ['**/*.stories.{ts,tsx}'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      // Stories often pass anonymous setStates to Storybook controls — the
      // "synchronous setState inside effect" warning fires on legitimate
      // demo patterns. Keep it on for component sources only.
      'react-hooks/set-state-in-effect': 'off',
    },
  }
);
