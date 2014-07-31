module.exports = function (config) {

  var isCI = Boolean(process.env.CI);
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
      { pattern: 'bower_components/eventemitter2/lib/*.js', included: false },
      { pattern: 'bower_components/waveform-data/dist/*.js', included: false },
      { pattern: 'bower_components/KineticJS/*.js', included: false },
      { pattern: 'test/*.html' },
      { pattern: 'src/**/*.js', included: false },
      { pattern: 'test/unit/**/*.js', included: false },
      { pattern: 'test_data/sample.*', included: false, served: true },
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

    // Start these browsers, currently available:
    browsers : isCI
      ? ['BSChrome', 'BSFirefox', 'BSSafari6', 'BSSafari7', 'BSIE9', 'BSIE10', 'BSIE11']
      : (isFast ? ['Chrome'] : ['Chrome', 'Safari', 'Firefox', 'IE9 - Win7']),

    browserDisconnectTolerance: isCI ? 3 : 1,
    browserNoActivityTimeout: isCI ? 120000 : null,

    browserStack: {
      build: process.env.TRAVIS_JOB_NUMBER || 'localhost',
      project: 'peaks.js'
    },

    customLaunchers: {
      'BSChrome': {
        base: 'BrowserStack',
        browser: 'Chrome',
        browser_version: '27.0',
        os: 'OS X',
        os_version: '10.6'
      },
      'BSFirefox': {
        base: 'BrowserStack',
        browser: 'Firefox',
        browser_version: '26.0',
        os: 'Windows',
        os_version: '7'
      },
      'BSSafari6': {
        base: 'BrowserStack',
        browser: 'Safari',
        browser_version: '6.0',
        os: 'OS X',
        os_version: 'Lion'
      },
      'BSSafari7': {
        base: 'BrowserStack',
        browser: 'Safari',
        browser_version: '7.0',
        os: 'OS X',
        os_version: 'Mavericks'
      },
      'BSIE9': {
        base: 'BrowserStack',
        browser: 'IE',
        browser_version: '9.0',
        os: 'Windows',
        os_version: '7'
      },
      'BSIE10': {
        base: 'BrowserStack',
        browser: 'IE',
        browser_version: '10',
        os: 'Windows',
        os_version: '8'
      },
      'BSIE11': {
        base: 'BrowserStack',
        browser: 'IE',
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
};
