'use strict';
/* eslint-env node */

var commonjs = require('rollup-plugin-commonjs');
var resolve = require('rollup-plugin-node-resolve');
var babel = require('@rollup/plugin-babel');
var json = require('@rollup/plugin-json');
var istanbul = require('rollup-plugin-istanbul');

function filterBrowsers(browsers, re) {
  return Object.keys(browsers).filter(function(key) {
    return re.test(key);
  });
}

module.exports = function(config) {
  var isCI = Boolean(process.env.CI) && Boolean(process.env.BROWSER_STACK_ACCESS_KEY);

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
      { pattern: 'test/unit/tests.js', type: 'module', included: true }
    ],

    mime: {
      'application/octet-stream': ['dat']
    },

    preprocessors: {
      'test/unit/tests.js': ['rollup']
    },

    rollupPreprocessor: {
      plugins: [
        commonjs(),
        json(),
        resolve({ browser: true }),
        babel.babel({
          babelHelpers: 'bundled',
          exclude: 'node_modules/**'
        }),
        istanbul({
          exclude: [
            'test/unit/*.js',
            'test_data/**',
            'node_modules/**/*.js'
          ]
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

    browserDisconnectTolerance: isCI ? 3 : 1,
    browserNoActivityTimeout: isCI ? 120000 : null,

    browserStack: {
      build: process.env.TRAVIS_JOB_NUMBER || ('localhost ' + Date.now()),
      project: 'bbcrd/peaks.js'
    },

    customLaunchers: {
      'BSChrome27': {
        base: 'BrowserStack',
        browser: 'chrome',
        browser_version: '27.0',
        os: 'Windows',
        os_version: 'XP'
      },
      'BSChromeLatest': {
        base: 'BrowserStack',
        browser: 'chrome',
        browser_version: 'latest',
        os: 'OS X',
        os_version: 'Mavericks'
      },
      'BSFirefox26': {
        base: 'BrowserStack',
        browser: 'firefox',
        browser_version: '26.0',
        os: 'Windows',
        os_version: '7'
      },
      'BSFirefoxLatest': {
        base: 'BrowserStack',
        browser: 'firefox',
        browser_version: 'latest',
        os: 'OS X',
        os_version: 'Mavericks'
      },
      'BSSafari6': {
        base: 'BrowserStack',
        browser: 'safari',
        browser_version: '6.0',
        os: 'OS X',
        os_version: 'Lion'
      },
      'BSSafari7': {
        base: 'BrowserStack',
        browser: 'safari',
        browser_version: '7.0',
        os: 'OS X',
        os_version: 'Mavericks'
      },
      'BSIE9': {
        base: 'BrowserStack',
        browser: 'ie',
        browser_version: '9.0',
        os: 'Windows',
        os_version: '7'
      },
      'BSIE10': {
        base: 'BrowserStack',
        browser: 'ie',
        browser_version: '10',
        os: 'Windows',
        os_version: '8'
      },
      'BSIE11': {
        base: 'BrowserStack',
        browser: 'ie',
        browser_version: '11',
        os: 'Windows',
        os_version: '8.1'
      },
      'ChromeHeadlessWithoutAutoplayPolicy': {
        base: 'ChromeHeadless',
        flags: ['--autoplay-policy=no-user-gesture-required']
      }
    },

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 120000,

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true
  });

  config.set({
    browsers: isCI  ? filterBrowsers(config.customLaunchers, /^BS/)
                    : ['ChromeHeadlessWithoutAutoplayPolicy']
  });
};
