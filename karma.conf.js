module.exports = function (config) {

  var isCI = Boolean(process.env.CI);
  var isFast = Boolean(process.env.FAST);

  config.set({
    // Karma configuration

    // base path, that will be used to resolve files and exclude
    basePath : '',

    frameworks : ['mocha', 'requirejs', 'chai', 'sinon'],

    // list of files / patterns to load in the browser
    files : [
      { pattern: 'test/test_img/*', included: false },
      { pattern: 'test_data/*', included: false },
      { pattern: 'bower_components/eventEmitter/*.js', included: false },
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
    reporters : ['progress'],

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
      ? ['SauceChrome', 'SauceFirefox', 'SauceFirefoxLinux', 'SauceSafari6', 'SauceSafari7', 'SauceIE9', 'SauceIE10', 'SauceIE11']
      : (isFast ? ['Chrome'] : ['Chrome', 'Safari', 'Firefox']),

    browserDisconnectTolerance: 2,
    browserNoActivityTimeout: 30000,

    sauceLabs: {
      username: process.env.SAUCE_USERNAME,
      accessKey: process.env.SAUCE_ACCESS_KEY,
      build: process.env.TRAVIS_JOB_NUMBER || 'local tunnel',
      testName: 'peaks.js (by R&D IRFS)',
      startConnect: true
    },

    customLaunchers: {
      'SauceChrome': {
        base: 'SauceLabs',
        browserName: 'chrome',
        platform: 'OS X 10.6',
        version: '27'
      },
      'SauceFirefox': {
        base: 'SauceLabs',
        browserName: 'firefox',
        platform: 'Windows 7',
        version: '21'
      },
      'SauceFirefoxLinux': {
        base: 'SauceLabs',
        browserName: 'firefox',
        platform: 'Linux',
        version: '26'
      },
      'SauceSafari6': {
        base: 'SauceLabs',
        browserName: 'safari',
        platform: 'OS X 10.8',
        version: '6'
      },
      'SauceSafari7': {
        base: 'SauceLabs',
        browserName: 'safari',
        platform: 'OS X 10.9',
        version: '7'
      },
      'SauceIE9': {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 7',
        version: '9'
      },
      'SauceIE10': {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 8',
        version: '10'
      },
      'SauceIE11': {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 8.1',
        version: '11'
      }
    },

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout : 10000,

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun : true

  });
};
