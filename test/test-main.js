var tests = [];
for (var file in window.__karma__.files) {
  if (window.__karma__.files.hasOwnProperty(file)) {
    if (/-spec\.js$/.test(file)) {
      tests.push(file);
    }
  }
}


function loadFixtures(filename){
  var el = document.createElement('div');
  el.id = 'fixtures-container-' + filename;
  el.innerHTML = window.__html__['test/'+ filename +'.html'].replace('localhost', window.location.hostname);
  document.body.appendChild(el);

  return el;
}

var fixtureFiles = ['audioElement', 'waveformContainer'];
var loadAllFixtures = fixtureFiles.forEach.bind(fixtureFiles, loadFixtures);

requirejs.config({
    // Karma serves files from '/base'
    baseUrl: '/base',

    paths: {
        'peaks': 'src/main',
        'waveform-data': 'node_modules/waveform-data/dist/waveform-data',
        'EventEmitter': 'node_modules/eventemitter2/lib/eventemitter2',
        'Kinetic': 'node_modules/kinetic/kinetic'
    },

    // ask Require.js to load these files (all our tests)
    deps: tests,

    // start test run, once Require.js is done
    callback: function(){
      loadAllFixtures();
      window.__karma__.start();
    }
});

