var tests = [];
for (var file in window.__karma__.files) {
  if (window.__karma__.files.hasOwnProperty(file)) {
    if (/-spec\.js$/.test(file)) {
      tests.push(file);
    }
  }
}
//console.log(window.__karma__.files);
requirejs.config({
    // Karma serves files from '/base'
    baseUrl: '/base/lib/js',

    paths: {
        'm': 'waveform_viewer',
        'waveform-data': '../../bower_components/waveform-data/dist/waveform-data',
        'EventEmitter': '../../bower_components/eventEmitter/EventEmitter.min',
        'jquery': '../../bower_components/jquery/jquery',
        'underscore': '../../bower_components/lodash/dist/lodash.compat',
        'Kinetic': '../../bower_components/KineticJS/index'
    },

    shim: {
        'underscore': {
            exports: '_'
        }
    },

    // ask Require.js to load these files (all our tests)
    deps: tests,

    // start test run, once Require.js is done
    callback: window.__karma__.start
});

