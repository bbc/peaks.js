import Peaks from '../peaks.esm.js';

import { createPointMarker, createSegmentMarker } from './marker-factories';
import { createSegmentLabel } from './segment-label-factory';

function renderSegments(peaks) {
  var segmentsContainer = document.getElementById('segments');
  var segments = peaks.segments.getSegments();
  var html = '';

  for (var i = 0; i < segments.length; i++) {
    var segment = segments[i];

    var row = '<tr>' +
      '<td>' + segment.id + '</td>' +
      '<td><input data-action="update-segment-label" type="text" value="' + segment.labelText + '" data-id="' + segment.id + '"/></td>' +
      '<td><input data-action="update-segment-start-time" type="number" value="' + segment.startTime + '" data-id="' + segment.id + '"/></td>' +
      '<td><input data-action="update-segment-end-time" type="number" value="' + segment.endTime + '" data-id="' + segment.id + '"/></td>' +
      '<td>' + '<a href="#' + segment.id + '" data-action="play-segment" data-id="' + segment.id + '">Play</a>' + '</td>' +
      '<td>' + '<a href="#' + segment.id + '" data-action="remove-segment" data-id="' + segment.id + '">Remove</a>' + '</td>' +
      '</tr>';

    html += row;
  }

  segmentsContainer.querySelector('tbody').innerHTML = html;

  if (html.length) {
    segmentsContainer.classList.remove('hide');
  }

  document.querySelectorAll('input[data-action="update-segment-start-time"]').forEach(function(inputElement) {
    inputElement.addEventListener('input', function(event) {
      var element = event.target;
      var id = element.getAttribute('data-id');
      var segment = peaks.segments.getSegment(id);

      if (segment) {
        var startTime = parseFloat(element.value);

        if (startTime < 0) {
          startTime = 0;
          element.value = 0;
        }

        if (startTime >= segment.endTime) {
          startTime = segment.endTime - 0.1;
          element.value = startTime;
        }

        segment.update({ startTime: startTime });
      }
    });
  });

  document.querySelectorAll('input[data-action="update-segment-end-time"]').forEach(function(inputElement) {
    inputElement.addEventListener('input', function(event) {
      var element = event.target;
      var id = element.getAttribute('data-id');
      var segment = peaks.segments.getSegment(id);

      if (segment) {
        var endTime = parseFloat(element.value);

        if (endTime < 0) {
          endTime = 0;
          element.value = 0;
        }

        if (endTime <= segment.startTime) {
          endTime = segment.startTime + 0.1;
          element.value = endTime;
        }

        segment.update({ endTime: endTime });
      }
    });
  });

  document.querySelectorAll('input[data-action="update-segment-label"]').forEach(function(inputElement) {
    inputElement.addEventListener('input', function(event) {
      var element = event.target;
      var id = element.getAttribute('data-id');
      var segment = peaks.segments.getSegment(id);
      var labelText = element.labelText;

      if (segment) {
        segment.update({ labelText: labelText });
      }
    });
  });
};

function renderPoints(peaks) {
  var pointsContainer = document.getElementById('points');
  var points = peaks.points.getPoints();
  var html = '';

  for (var i = 0; i < points.length; i++) {
    var point = points[i];

    var row = '<tr>' +
      '<td>' + point.id + '</td>' +
      '<td><input data-action="update-point-label" type="text" value="' + point.labelText + '" data-id="' + point.id + '"/></td>' +
      '<td><input data-action="update-point-time" type="number" value="' + point.time + '" data-id="' + point.id + '"/></td>' +
      '<td>' + '<a href="#' + point.id + '" data-action="remove-point" data-id="' + point.id + '">Remove</a>' + '</td>' +
      '</tr>';

    html += row;
  }

  pointsContainer.querySelector('tbody').innerHTML = html;

  if (html.length) {
    pointsContainer.classList.remove('hide');
  }

  document.querySelectorAll('input[data-action="update-point-time"]').forEach(function(inputElement) {
    inputElement.addEventListener('input', function(event) {
      var element = event.target;
      var id = element.getAttribute('data-id');
      var point = peaks.points.getPoint(id);

      if (point) {
        var time = parseFloat(element.value);

        if (time < 0) {
          time = 0;
          element.value = 0;
        }

        point.update({ time: time });
      }
    });
  });

  document.querySelectorAll('input[data-action="update-point-label"]').forEach(function(inputElement) {
    inputElement.addEventListener('input', function(event) {
      var element = event.target;
      var id = element.getAttribute('data-id');
      var point = peaks.points.getPoint(id);
      var labelText = element.labelText;

      if (point) {
        point.update({ labelText: labelText });
      }
    });
  });
};

var options = {
  zoomview: {
    container: document.getElementById('zoomview-container'),
    waveformColor: {
      linearGradientStart: 20,
      linearGradientEnd: 60,
      linearGradientColorStops: ['hsl(180, 78%, 46%)', 'hsl(180, 78%, 16%)']
    }
  },
  overview: {
    container: document.getElementById('overview-container'),
    waveformColor: {
      linearGradientStart: 50,
      linearGradientEnd: 58,
      linearGradientColorStops: ['rgba(150, 0, 0, 0.2)', 'rgba(150, 0, 0, 0.5)']
    },
    highlightColor: '#888'
  },
  segmentOptions: {
    startMarkerColor: '#006eb0',
    endMarkerColor: '#006eb0'
  },
  mediaElement: document.getElementById('audio'),
  dataUri: {
    arraybuffer: 'TOL_6min_720p_download.dat',
    json: 'TOL_6min_720p_download.json'
  },
  keyboard: true,
  showPlayheadTime: false,
  createSegmentMarker: createSegmentMarker,
  createSegmentLabel: createSegmentLabel,
  createPointMarker: createPointMarker,
};

Peaks.init(options, function(err, peaksInstance) {
  if (err) {
    console.error(err.message);
    return;
  }

  console.log("Peaks instance ready");

  document.querySelector('[data-action="zoom-in"]').addEventListener('click', function() {
    peaksInstance.zoom.zoomIn();
  });

  document.querySelector('[data-action="zoom-out"]').addEventListener('click', function() {
    peaksInstance.zoom.zoomOut();
  });

  var segmentCounter = 1;

  document.querySelector('button[data-action="add-segment"]').addEventListener('click', function() {
    peaksInstance.segments.add({
      startTime: peaksInstance.player.getCurrentTime(),
      endTime: peaksInstance.player.getCurrentTime() + 10,
      labelText: 'Segment ' + segmentCounter++,
      editable: true,
      color: {
        linearGradientStart: 20,
        linearGradientEnd: 60,
        linearGradientColorStops: ['hsl(40, 78%, 46%)', 'hsl(80, 78%, 16%)']
      }
    });
  });

  var pointCounter = 1;

  document.querySelector('button[data-action="add-point"]').addEventListener('click', function() {
    peaksInstance.points.add({
      time: peaksInstance.player.getCurrentTime(),
      labelText: 'Point ' + pointCounter++,
      color: '#006eb0',
      editable: true
    });
  });

  document.querySelector('button[data-action="log-data"]').addEventListener('click', function(event) {
    renderSegments(peaksInstance);
    renderPoints(peaksInstance);
  });

  document.querySelector('button[data-action="seek"]').addEventListener('click', function(event) {
    var time = document.getElementById('seek-time').value;
    var seconds = parseFloat(time);

    if (!Number.isNaN(seconds)) {
      peaksInstance.player.seek(seconds);
    }
  });

  document.querySelector('button[data-action="destroy"]').addEventListener('click', function(event) {
    peaksInstance.destroy();
  });

  document.getElementById('auto-scroll').addEventListener('change', function(event) {
    var view = peaksInstance.views.getView('zoomview');
    view.enableAutoScroll(event.target.checked);
  });

  document.querySelector('body').addEventListener('click', function(event) {
    var element = event.target;
    var action  = element.getAttribute('data-action');
    var id      = element.getAttribute('data-id');

    if (action === 'play-segment') {
      var segment = peaksInstance.segments.getSegment(id);
      peaksInstance.player.playSegment(segment);
    }
    else if (action === 'remove-point') {
      peaksInstance.points.removeById(id);
    }
    else if (action === 'remove-segment') {
      peaksInstance.segments.removeById(id);
    }
  });

  var amplitudeScales = {
    "0": 0.0,
    "1": 0.1,
    "2": 0.25,
    "3": 0.5,
    "4": 0.75,
    "5": 1.0,
    "6": 1.5,
    "7": 2.0,
    "8": 3.0,
    "9": 4.0,
    "10": 5.0
  };

  document.getElementById('amplitude-scale').addEventListener('input', function(event) {
    var scale = amplitudeScales[event.target.value];

    peaksInstance.views.getView('zoomview').setAmplitudeScale(scale);
    peaksInstance.views.getView('overview').setAmplitudeScale(scale);
  });

  document.querySelector('button[data-action="resize"]').addEventListener('click', function(event) {
    const zoomviewContainer = document.getElementById('zoomview-container');
    const overviewContainer = document.getElementById('overview-container');

    zoomviewContainer.style.height = zoomviewContainer.offsetHeight === 200 ? "300px" : "200px";
    overviewContainer.style.height = overviewContainer.offsetHeight === 200 ? "85px"  : "200px";

    const zoomview = peaksInstance.views.getView('zoomview');

    if (zoomview) {
      zoomview.fitToContainer();
    }

    const overview = peaksInstance.views.getView('overview');

    if (overview) {
      overview.fitToContainer();
    }
  });

  // Points mouse events

  peaksInstance.on('points.mouseenter', function(event) {
    console.log('points.mouseenter:', event);
  });

  peaksInstance.on('points.mouseleave', function(event) {
    console.log('points.mouseleave:', event);
  });

  peaksInstance.on('points.click', function(event) {
    console.log('points.click:', event);
  });

  peaksInstance.on('points.dblclick', function(event) {
    console.log('points.dblclick:', event);
  });

  peaksInstance.on('points.contextmenu', function(event) {
    event.evt.preventDefault();

    console.log('points.contextmenu:', event);
  });

  peaksInstance.on('points.dragstart', function(event) {
    console.log('points.dragstart:', event);
  });

  peaksInstance.on('points.dragmove', function(event) {
    console.log('points.dragmove:', event);
  });

  peaksInstance.on('points.dragend', function(event) {
    console.log('points.dragend:', event);
  });

  // Segments mouse events

  peaksInstance.on('segments.dragstart', function(event) {
    console.log('segments.dragstart:', event);
  });

  peaksInstance.on('segments.dragend', function(event) {
    console.log('segments.dragend:', event);
  });

  peaksInstance.on('segments.dragged', function(event) {
    console.log('segments.dragged:', event);
  });

  peaksInstance.on('segments.mouseenter', function(event) {
    console.log('segments.mouseenter:', event);
  });

  peaksInstance.on('segments.mouseleave', function(event) {
    console.log('segments.mouseleave:', event);
  });

  peaksInstance.on('segments.click', function(event) {
    console.log('segments.click:', event);
  });

  peaksInstance.on('segments.dblclick', function(event) {
    console.log('segments.dblclick:', event);
  });

  peaksInstance.on('segments.contextmenu', function(event) {
    event.evt.preventDefault();

    console.log('segments.contextmenu:', event);
  });

  peaksInstance.on('zoomview.click', function(event) {
    console.log('zoomview.click:', event);
  });

  peaksInstance.on('zoomview.dblclick', function(event) {
    console.log('zoomview.dblclick:', event);
  });

  peaksInstance.on('zoomview.contextmenu', function(event) {
    event.evt.preventDefault();

    console.log('zoomview.contextmenu:', event);
  });

  peaksInstance.on('overview.click', function(event) {
    console.log('overview.click:', event);
  });

  peaksInstance.on('overview.dblclick', function(event) {
    console.log('overview.dblclick:', event);
  });

  peaksInstance.on('overview.contextmenu', function(event) {
    event.evt.preventDefault();

    console.log('overview.contextmenu:', event);
  });
});
