beforeEach(function(done) {
  var overviewContainer = document.createElement('div');
  overviewContainer.id = 'overview-container';
  overviewContainer.style.width = '1000px';
  overviewContainer.style.height = '100px';
  document.body.appendChild(overviewContainer);

  var zoomviewContainer = document.createElement('div');
  zoomviewContainer.id = 'zoomview-container';
  zoomviewContainer.style.width = '1000px';
  zoomviewContainer.style.height = '100px';
  document.body.appendChild(zoomviewContainer);

  var scrollbarContainer = document.createElement('div');
  scrollbarContainer.id = 'scrollbar-container';
  scrollbarContainer.style.width = '1000px';
  scrollbarContainer.style.height = '16px';
  document.body.appendChild(scrollbarContainer);

  var mediaElement = document.createElement('audio');
  mediaElement.id = 'media';
  mediaElement.src = '/base/test_data/sample.mp3';
  mediaElement.muted = true;
  document.body.appendChild(mediaElement);

  setTimeout(done, 0);
});

function removeElement(id) {
  var element = document.getElementById(id);

  if (element) {
    document.body.removeChild(element);
  }
}

afterEach(function() {
  removeElement('zoomview-container');
  removeElement('overview-container');
  removeElement('media');
});
