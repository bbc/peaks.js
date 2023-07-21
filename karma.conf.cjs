'use strict';
/* eslint-env node */

const commonjs = require('@rollup/plugin-commonjs');
const resolve = require('@rollup/plugin-node-resolve').nodeResolve;
const babel = require('@rollup/plugin-babel');
const json = require('@rollup/plugin-json');

module.exports = function(config) {
  // Karma configuration
  config.set({
    // The root path location that will be used to resolve all relative paths
    // defined in 'files' and 'exclude'.
    basePath: '',

    frameworks: ['mocha', 'chai-sinon'],

    client: {
      chai: {
        includeStack: true
      },
      mocha: {
        timeout: 10000
      }
    },

    // list of files / patterns to load in the browser
    files: [
      { pattern: 'test_data/*', included: false },
      { pattern: 'test/tests.js', type: 'module', included: true }
    ],

    mime: {
      'application/octet-stream': ['dat']
    },

    preprocessors: {
      'test/tests.js': ['rollup']
    },

    rollupPreprocessor: {
      plugins: [
        commonjs(),
        json(),
        resolve({ browser: true }),
        babel.babel({
          babelHelpers: 'bundled',
          exclude: 'node_modules/**',
          plugins: ['istanbul']
        })
      ],
      output: {
        format: 'iife',
        name: 'peaks',
        sourcemap: 'inline'
      }
    },

    // test results reporter to use
    // possible values: dots || progress || growl || spec
    reporters: ['spec', 'coverage'],

    // configure the test coverage reporter
    coverageReporter: {
      reporters: [
        { type: 'html', dir: 'coverage', subdir: '.' },
        { type: 'text' },
        { type: 'text-summary' }
      ]
    },

    // web server port
    port: 8080,

    // CLI runner port
    runnerPort: 9100,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    customLaunchers: {
      ChromeHeadlessWithoutAutoplayPolicy: {
        base: 'ChromeHeadless',
        flags: ['--autoplay-policy=no-user-gesture-required']
      },
      FirefoxHeadless: {
        base: 'Firefox',
        flags: ['-headless']
      }
    },

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 120000,

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true
  });

  config.set({
    browsers: ['ChromeHeadlessWithoutAutoplayPolicy']
  });
};
