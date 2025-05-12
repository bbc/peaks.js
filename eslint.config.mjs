import globals from 'globals';
import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import stylisticJs from '@stylistic/eslint-plugin-js';
import mochaPlugin from 'eslint-plugin-mocha';

const commonRules = {
  'block-scoped-var': 'error',
  'consistent-this': ['error', 'self'],
  'curly': ['error', 'all'],
  'dot-notation': 'error',
  'eqeqeq': 'error',
  'for-direction': 'off',
  'func-style': ['error', 'declaration'],
  'guard-for-in': 'error',
  'new-cap': 'error',
  'no-alert': 'error',
  'no-caller': 'error',
  'no-cond-assign': ['error', 'except-parens'],
  'no-console': 'warn',
  'no-continue': 'error',
  'no-debugger': 'warn',
  'no-eval': 'error',
  'no-extra-bind': 'error',
  'no-implicit-coercion': 'error',
  'no-implicit-globals': 'error',
  'no-implied-eval': 'error',
  'no-label-var': 'error',
  'no-labels': 'error',
  'no-lone-blocks': 'error',
  'no-lonely-if': 'off',
  'no-loop-func': 'error',
  'no-multi-str': 'error',
  'no-nested-ternary': 'error',
  'no-object-constructor': 'error',
  'no-return-assign': 'error',
  'no-script-url': 'error',
  'no-self-compare': 'error',
  'no-sequences': 'error',
  'no-throw-literal': 'error',
  'no-unmodified-loop-condition': 'error',
  'no-unused-expressions': 'error',
  'no-unused-vars': ['warn', { 'args': 'all' }],
  'no-useless-call': 'error',
  'no-useless-concat': 'error',
  'no-useless-escape': 'error',
  'no-undef-init': 'error',
  'no-use-before-define': 'error',
  'no-var': 'error',
  'no-void': 'error',
  'operator-assignment': ['error', 'always'],
  'prefer-const': 'error',
  'radix': 'error',
  'yoda': 'error',
  '@stylistic/js/array-bracket-spacing': ['warn', 'never'],
  '@stylistic/js/brace-style': ['warn', 'stroustrup'],
  '@stylistic/js/comma-dangle': ['warn', 'never'],
  '@stylistic/js/comma-spacing': ['warn', { 'before': false, 'after': true }],
  '@stylistic/js/comma-style': ['warn', 'last'],
  '@stylistic/js/dot-location': ['warn', 'property'],
  '@stylistic/js/indent': [
    'warn',
    2,
    {
      'SwitchCase': 1,
      'VariableDeclarator': 2,
      'FunctionDeclaration': {
        'body': 1,
        'parameters': 1
      },
      'FunctionExpression': {
        'body': 1,
        'parameters': 2
      },
      'ignoredNodes': ['ConditionalExpression'],
      'ArrayExpression': 1
    }
  ],
  '@stylistic/js/key-spacing': [
    'warn',
    {
      'beforeColon': false,
      'afterColon': true,
      'mode': 'minimum'
    }
  ],
  '@stylistic/js/keyword-spacing': ['warn', { 'before': true }],
  '@stylistic/js/linebreak-style': ['warn', 'unix'],
  '@stylistic/js/max-len': ['warn', 100],
  '@stylistic/js/newline-per-chained-call': 'warn',
  '@stylistic/js/no-extra-semi': 'warn',
  '@stylistic/js/no-floating-decimal': 'warn',
  '@stylistic/js/no-multiple-empty-lines': ['warn', { 'max': 1 }],
  '@stylistic/js/no-tabs': 'warn',
  '@stylistic/js/no-trailing-spaces': 'warn',
  '@stylistic/js/object-curly-spacing': ['warn', 'always'],
  '@stylistic/js/padded-blocks': ['warn', 'never'],
  '@stylistic/js/padding-line-between-statements': [
    'warn',
    { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
    { blankLine: 'any',    prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] }
  ],
  '@stylistic/js/quotes': ['warn', 'single', { 'avoidEscape': true }],
  '@stylistic/js/semi': ['warn', 'always'],
  '@stylistic/js/space-before-blocks': 'warn',
  '@stylistic/js/space-before-function-paren': ['warn', 'never'],
  '@stylistic/js/space-in-parens': ['warn', 'never'],
  '@stylistic/js/space-infix-ops': 'warn',
  '@stylistic/js/space-unary-ops': 'warn',
  '@stylistic/js/spaced-comment': [
    'warn',
    'always',
    {
      'block': { 'balanced': true }
    }
  ]
};

export default defineConfig([
  {
    files: ['src/*.js', '*.{js,mjs,cjs,ts}'],
    plugins: {
      'js': js,
      '@stylistic/js': stylisticJs
    },
    extends: ['js/recommended'],
    languageOptions: {
      ecmaVersion: 2015,
      globals: globals.browser
    },
    rules: commonRules
  },
  {
    files: ['test/*.js'],
    plugins: {
      'js': js,
      '@stylistic/js': stylisticJs,
      'mocha': mochaPlugin
    },
    extends: ['js/recommended', 'mocha/all'],
    languageOptions: {
      ecmaVersion: 2015,
      globals: Object.assign({}, globals.browser, {
        // Define Mocha globals
        context: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        sinon: 'readonly'
      })
    },
    rules: Object.assign({}, commonRules, { // mochaPlugin.configs.all
      // Disable no-unused-expressions for chai expectations
      'no-unused-expressions': 'off',
      '@stylistic/js/brace-style': ['error', 'stroustrup', { 'allowSingleLine': true }],
      '@stylistic/js/max-len': 'off',
      '@stylistic/js/padding-line-between-statements': 'off',

      // TODO: Disable this because it causes an error:
      // TypeError: Cannot read properties of undefined (reading '0')
      'mocha/consistent-spacing-between-blocks': 'off',
      'mocha/no-hooks': 'off',
      'mocha/no-hooks-for-single-case': 'off',
      'mocha/no-setup-in-describe': 'off',
      'mocha/no-top-level-hooks': 'off',
      'mocha/no-synchronous-tests': 'off',
      'mocha/prefer-arrow-callback': 'off'
    })
  }
]);
