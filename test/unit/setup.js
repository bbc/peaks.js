beforeEach(function(done) {
  var container = document.createElement('div');
  container.id = 'container';
  container.width = '1000px';
  document.body.appendChild(container);

  var mediaElement = document.createElement('audio');
  mediaElement.id = 'media';
  mediaElement.src = '/base/test_data/sample.mp3';
  document.body.appendChild(mediaElement);

  setTimeout(done, 0);
});

afterEach(function() {
  var container = document.getElementById('container');

  if (container) {
    document.body.removeChild(container);
  }

  var mediaElement = document.getElementById('media');

  if (mediaElement) {
    document.body.removeChild(mediaElement);
  }
});
