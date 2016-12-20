'use strict';

function filterBrowsers(browsers, re) {
  return Object.keys(browsers).filter(function(key) {
    return re.test(key);
  });
}

module.exports = function(config) {
  var isCI = Boolean(process.env.CI) && Boolean(process.env.BROWSER_STACK_ACCESS_KEY);

  // Karma configuration
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    frameworks: ['mocha', 'sinon-chai', 'browserify'],

    client: {
      chai: {
        includeStack: true
      },
      mocha: {
        timeout: 5000
      }
    },

    browserify: {
      debug: true,
      transform: [
        'deamdify'
      ]
    },

    // list of files / patterns to load in the browser
    files: [
      { pattern: 'test/test_img/*', included: false },
      { pattern: 'test_data/*', included: false },
      { pattern: 'test_data/sample.{dat,json}', included: false, served: true },
      { pattern: 'test/*.html' },
      'test/load-fixtures.js',
      'test/unit/**/*.js'
    ],

    preprocessors: {
      'test/unit/**/*.js': ['browserify'],
      'test/*.html': ['html2js']
    },

    // test results reporter to use
    // possible values: dots || progress || growl || spec
    reporters: isCI ? ['dots'] : ['spec'],

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
      }
    },

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 120000,

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true
  });

  config.set({
    browsers: isCI ? filterBrowsers(config.customLaunchers, /^BS/) : ['Chrome']
  });
};
