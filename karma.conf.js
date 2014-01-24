module.exports = function (config) {
  config.set({
    // Karma configuration

    // base path, that will be used to resolve files and exclude
    basePath : '',

    plugins: [
      'karma-jasmine',
      'karma-requirejs',
      'karma-html2js-preprocessor',
      'karma-phantomjs-launcher',
      'karma-chrome-launcher',
      'karma-firefox-launcher'
    ],

    frameworks : ['jasmine', 'requirejs'],

    // list of files / patterns to load in the browser
    files : [
      { pattern: 'test/test_img/*', included: false },
      { pattern: 'test_data/*', included: false },
      { pattern: 'bower_components/jquery/jquery.js', included: true },
      { pattern: 'test/lib/jasmine-jquery.js', included: true },
      { pattern: 'bower_components/eventEmitter/EventEmitter.min.js', included: false },
      { pattern: 'bower_components/waveform-data/dist/waveform-data.js', included: false },
      { pattern: 'bower_components/lodash/dist/lodash.compat.js', included: false },
      { pattern: 'bower_components/KineticJS/index.js', included: false },
      //'build/js/peaks.min.js',
      //'lib/js/almond.js',
      //'lib/vendor/require.js',
      //'test/fixtures.js',
      { pattern: 'lib/js/**/*.js', included: false },
      { pattern: 'test/unit/**/*.js', included: false },
      { pattern: 'test/audioElement.html', included: false },
      'test/test-main.js'
    ],

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
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers : ['Chrome', 'Safari', 'Firefox'],

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout : 5000,

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun : false,

  });
};
