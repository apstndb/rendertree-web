import eslint from '@eslint/js';
import typescriptEslint from 'typescript-eslint';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  eslint.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**', '*.js', '.output.txt'],
  },
  // Browser TypeScript files
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'react-refresh': reactRefreshPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      parser: typescriptEslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node, // Add Node.js globals for process, etc.
        React: 'readonly',
      },
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': 'off', // Turn off no-unused-vars to avoid errors with interface properties
    },
  },
  // Context files - disable react-refresh/only-export-components
  {
    files: ['src/contexts/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  // Test files
  {
    files: ['tests/**/*.ts', 'tests/**/*.tsx'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    languageOptions: {
      parser: typescriptEslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      'no-console': 'off', // Allow console in test files
      'prefer-const': 'error',
      'no-var': 'error',
      'no-unused-vars': 'off', // Turn off no-unused-vars to avoid errors with interface properties
    },
  },
  // Node.js TypeScript files
  {
    files: ['*.config.ts', 'src/vite-plugin-go-wasm.ts'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    languageOptions: {
      parser: typescriptEslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off', // Allow console in config files
      'prefer-const': 'error',
      'no-var': 'error',
      'no-unused-vars': 'off', // Turn off no-unused-vars to avoid errors with interface properties
    },
  }
];
