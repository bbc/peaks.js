'use strict';

function filterBrowsers(browsers, re){
  return Object.keys(browsers).filter(function(key){
    return re.test(key);
  });
}

module.exports = function (config) {

  var isCI = (Boolean(process.env.CI) && Boolean(process.env.BROWSER_STACK_ACCESS_KEY)) === true;
  var isFast = Boolean(process.env.FAST);

  config.set({
    // Karma configuration

    // base path, that will be used to resolve files and exclude
    basePath : '',

    frameworks : ['mocha', 'requirejs', 'sinon-chai'],

    // list of files / patterns to load in the browser
    files : [
      { pattern: 'test/test_img/*', included: false },
      { pattern: 'test_data/*', included: false },
      { pattern: 'node_modules/eventemitter2/lib/*.js', included: false },
      { pattern: 'node_modules/waveform-data/dist/*.js', included: false },
      { pattern: 'node_modules/kinetic/*.js', included: false },
      { pattern: 'test/*.html' },
      { pattern: 'src/**/*.js', included: false },
      { pattern: 'test/unit/**/*.js', included: false },
      { pattern: 'test_data/sample.{dat,json}', included: false, served: true },
      'test/test-main.js'
    ],

    preprocessors: {
      'test/*.html': ['html2js']
    },

    // list of files to exclude
    //exclude : ['lib/js/main.js'],

    // test results reporter to use
    // possible values: dots || progress || growl
    reporters : isCI ? ['dots'] : ['progress'],

    // web server port
    port : 8080,

    // cli runner port
    runnerPort : 9100,

    // enable / disable colors in the output (reporters and logs)
    colors : true,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel : config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch : false,

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
    captureTimeout : 120000,

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun : true

  });

  config.set({
    browsers: isCI ? filterBrowsers(config.customLaunchers, /^BS/) : (isFast ? ['Chrome', 'Firefox'] : ['Chrome', 'Safari', 'Firefox', 'IE9 - Win7'])
  });
};
