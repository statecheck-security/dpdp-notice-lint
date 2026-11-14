// typescript-eslint recommended-type-checked plus the house rules shared with dpdp-webscan.
// console.* is allowed nowhere: the CLI writes through its `io` argument.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // scripts/legalRules.mjs is vendored verbatim from statecheck-docs and is never linted or formatted here.
  { ignores: ['node_modules/', 'dist/', 'coverage/', 'scripts/legalRules.mjs'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['eslint.config.js', 'scripts/*.mjs'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['test/**/*.ts'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
  {
    files: ['eslint.config.js', 'scripts/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
);
