function loadFixtures(filename) {
  var el = document.createElement('div');

  el.id = 'fixtures-container-' + filename;
  el.innerHTML = window.__html__['test/' + filename + '.html']
                       .replace('localhost', window.location.hostname);
  document.body.appendChild(el);

  return el;
}

var fixtureFiles = ['audioElement', 'waveformContainer'];

fixtureFiles.forEach(loadFixtures);
