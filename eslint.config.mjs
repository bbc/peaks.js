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
  'newline-after-var': ['error', 'always'],
  'no-alert': 'error',
  'no-caller': 'error',
  'no-cond-assign': ['error', 'except-parens'],
  'no-console': 'warn',
  'no-continue': 'error',
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
  'no-new-object': 'error',
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
  'padded-blocks': ['warn', 'never'],
  'prefer-const': 'error',
  'radix': 'error',
  'yoda': 'error',
  '@stylistic/js/array-bracket-spacing': ['error', 'never'],
  '@stylistic/js/brace-style': ['error', 'stroustrup'],
  '@stylistic/js/comma-dangle': ['warn', 'never'],
  '@stylistic/js/comma-spacing': ['warn', { 'before': false, 'after': true }],
  '@stylistic/js/comma-style': ['error', 'last'],
  '@stylistic/js/dot-location': ['error', 'property'],
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
  '@stylistic/js/max-len': ['warn', 100],
  '@stylistic/js/key-spacing': [
    'error',
    {
      'beforeColon': false,
      'afterColon': true,
      'mode': 'minimum'
    }
  ],
  '@stylistic/js/keyword-spacing': ['error', { 'before': true }],
  '@stylistic/js/linebreak-style': ['error', 'unix'],
  '@stylistic/js/newline-per-chained-call': 'error',
  '@stylistic/js/no-extra-semi': 'error',
  '@stylistic/js/no-floating-decimal': 'error',
  '@stylistic/js/no-tabs': 'warn',
  '@stylistic/js/no-multiple-empty-lines': ['warn', { 'max': 1 }],
  '@stylistic/js/no-trailing-spaces': 'warn',
  '@stylistic/js/object-curly-spacing': ['error', 'always'],
  '@stylistic/js/quotes': ['warn', 'single', { 'avoidEscape': true }],
  '@stylistic/js/semi': ['error', 'always'],
  '@stylistic/js/space-before-blocks': 'warn',
  '@stylistic/js/space-before-function-paren': ['warn', 'never'],
  '@stylistic/js/space-in-parens': ['error', 'never'],
  '@stylistic/js/space-infix-ops': 'error',
  '@stylistic/js/space-unary-ops': 'error',
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
      '@stylistic/js/brace-style': ['error', 'stroustrup', { 'allowSingleLine': true }],
      // Disable no-unused-expressions for chai expectations
      'no-unused-expressions': 'off',
      'newline-after-var': 'off',
      '@stylistic/js/max-len': 'off',

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
