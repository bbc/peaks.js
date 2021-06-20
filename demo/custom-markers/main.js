import Peaks from '../../src/main';

import { Label, Tag } from 'konva/lib/shapes/Label';
import { Line } from 'konva/lib/shapes/Line';
import { Text } from 'konva/lib/shapes/Text';

/*
 * CustomSegmentMarker
 */

function CustomSegmentMarker(options) {
  this._options = options;
}

CustomSegmentMarker.prototype.init = function(group) {
  this._group = group;

  this._label = new Label({
    x: 0.5,
    y: 0.5
  });

  var color = this._options.segment.color;

  this._tag = new Tag({
    fill:             color,
    stroke:           color,
    strokeWidth:      1,
    pointerDirection: 'down',
    pointerWidth:     10,
    pointerHeight:    10,
    lineJoin:         'round',
    shadowColor:      'black',
    shadowBlur:       10,
    shadowOffsetX:    3,
    shadowOffsetY:    3,
    shadowOpacity:    0.3
  });

  this._label.add(this._tag);

  var labelText = this._options.segment.labelText +
                  (this._options.startMarker ? ' start' : ' end');

  this._text = new Text({
    text:       labelText,
    fontFamily: 'Calibri',
    fontSize:   14,
    padding:    5,
    fill:       'white'
  });

  this._label.add(this._text);

  // Vertical Line - create with default y and points, the real values
  // are set in fitToView().
  this._line = new Line({
    x:           0,
    y:           0,
    stroke:      color,
    strokeWidth: 1
  });

  group.add(this._label);
  group.add(this._line);

  this.fitToView();

  this.bindEventHandlers();
};

CustomSegmentMarker.prototype.bindEventHandlers = function() {
  var container = document.getElementById('zoomview-container');

  this._group.on('mouseenter', function() {
    container.style.cursor = 'move';
  });

  this._group.on('mouseleave', function() {
    container.style.cursor = 'default';
  });
};

CustomSegmentMarker.prototype.fitToView = function() {
  var height = this._options.layer.getHeight();

  var labelHeight = this._text.height() + 2 * this._text.padding();
  var offsetTop = 14;
  var offsetBottom = 26;

  this._group.y(offsetTop + labelHeight + 0.5);

  this._line.points([0.5, 0, 0.5, height - labelHeight - offsetTop - offsetBottom]);
};

function createSegmentMarker(options) {
  if (options.view === 'zoomview') {
    return new CustomSegmentMarker(options);
  }

  return null;
}

function createSegmentLabel(options) {
  if (options.view === 'overview') {
    return null;
  }

  var label = new Label({
    x: 12,
    y: 16
  });

  label.add(new Tag({
    fill:             'black',
    pointerDirection: 'none',
    shadowColor:      'black',
    shadowBlur:       10,
    shadowOffsetX:    3,
    shadowOffsetY:    3,
    shadowOpacity:    0.3
  }));

  label.add(new Text({
    text:       options.segment.labelText,
    fontSize:   14,
    fontFamily: 'Calibri',
    fill:       'white',
    padding:    8
  }));

  return label;
}

/*
 * CustomPointMarker
 */

function CustomPointMarker(options) {
  this._options = options;
}

CustomPointMarker.prototype.init = function(group) {
  this._group = group;

  this._label = new Label({
    x: 0.5,
    y: 0.5
  });

  this._tag = new Tag({
    fill:             this._options.color,
    stroke:           this._options.color,
    strokeWidth:      1,
    pointerDirection: 'down',
    pointerWidth:     10,
    pointerHeight:    10,
    lineJoin:         'round',
    shadowColor:      'black',
    shadowBlur:       10,
    shadowOffsetX:    3,
    shadowOffsetY:    3,
    shadowOpacity:    0.3
  });

  this._label.add(this._tag);

  this._text = new Text({
    text:       this._options.point.labelText,
    fontFamily: 'Calibri',
    fontSize:   14,
    padding:    5,
    fill:       'white'
  });

  this._label.add(this._text);

  // Vertical Line - create with default y and points, the real values
  // are set in fitToView().
  this._line = new Line({
    x:           0,
    y:           0,
    stroke:      this._options.color,
    strokeWidth: 1
  });

  group.add(this._label);
  group.add(this._line);

  this.fitToView();

  this.bindEventHandlers();
};

CustomPointMarker.prototype.bindEventHandlers = function() {
  var container = document.getElementById('zoomview-container');

  this._group.on('mouseenter', function() {
    container.style.cursor = 'move';
  });

  this._group.on('mouseleave', function() {
    container.style.cursor = 'default';
  });
};

CustomPointMarker.prototype.fitToView = function() {
  var height = this._options.layer.getHeight();

  var labelHeight = this._text.height() + 2 * this._text.padding();
  var offsetTop = 14;
  var offsetBottom = 26;

  this._group.y(offsetTop + labelHeight + 0.5);

  this._line.points([0.5, 0, 0.5, height - labelHeight - offsetTop - offsetBottom]);
};

/*
 * SimplePointMarker
 */

function SimplePointMarker(options) {
  this._options = options;
}

SimplePointMarker.prototype.init = function(group) {
  this._group = group;

  // Vertical Line - create with default y and points, the real values
  // are set in fitToView().
  this._line = new Line({
    x:           0,
    y:           0,
    stroke:      this._options.color,
    strokeWidth: 1
  });

  group.add(this._line);

  this.fitToView();
};

SimplePointMarker.prototype.fitToView = function() {
  var height = this._options.layer.getHeight();

  this._line.points([0.5, 0, 0.5, height]);
};

function createPointMarker(options) {
  if (options.view === 'zoomview') {
    return new CustomPointMarker(options);
  }
  else {
    return new SimplePointMarker(options);
  }
}

var renderSegments = function(peaks) {
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

var renderPoints = function(peaks) {
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
  containers: {
    zoomview: document.getElementById('zoomview-container'),
    overview: document.getElementById('overview-container')
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
  overviewWaveformColor: {
    linearGradientStart: 50,
    linearGradientEnd: 58,
    linearGradientColorStops: ['rgba(150, 0, 0, 0.2)', 'rgba(150, 0, 0, 0.5)']
  },
  overviewHighlightColor: '#888',
  zoomWaveformColor: {
    linearGradientStart: 20,
    linearGradientEnd: 60,
    linearGradientColorStops: ['hsl(180, 78%, 46%)', 'hsl(180, 78%, 16%)']
  }
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
    var zoomviewContainer = document.getElementById('zoomview-container');
    var overviewContainer = document.getElementById('overview-container');

    var zoomviewStyle = zoomviewContainer.offsetHeight === 200 ? 'height:300px' : 'height:200px';
    var overviewStyle = overviewContainer.offsetHeight === 85  ? 'height:200px' : 'height:85px';

    zoomviewContainer.setAttribute('style', zoomviewStyle);
    overviewContainer.setAttribute('style', overviewStyle);

    var zoomview = peaksInstance.views.getView('zoomview');
    if (zoomview) {
      zoomview.fitToContainer();
    }

    var overview = peaksInstance.views.getView('overview');
    if (overview) {
      overview.fitToContainer();
    }
  });

  // Points mouse events

  peaksInstance.on('points.mouseenter', function(point) {
    console.log('points.mouseenter:', point);
  });

  peaksInstance.on('points.mouseleave', function(point) {
    console.log('points.mouseleave:', point);
  });

  peaksInstance.on('points.click', function(point) {
    console.log('points.click:', point);
  });

  peaksInstance.on('points.dblclick', function(point) {
    console.log('points.dblclick:', point);
  });

  peaksInstance.on('points.dragstart', function(point) {
    console.log('points.dragstart:', point);
  });

  peaksInstance.on('points.dragmove', function(point) {
    console.log('points.dragmove:', point);
  });

  peaksInstance.on('points.dragend', function(point) {
    console.log('points.dragend:', point);
  });

  // Segments mouse events

  peaksInstance.on('segments.dragstart', function(segment, startMarker) {
    console.log('segments.dragstart:', segment, startMarker);
  });

  peaksInstance.on('segments.dragend', function(segment, startMarker) {
    console.log('segments.dragend:', segment, startMarker);
  });

  peaksInstance.on('segments.dragged', function(segment, startMarker) {
    console.log('segments.dragged:', segment, startMarker);
  });

  peaksInstance.on('segments.mouseenter', function(segment) {
    console.log('segments.mouseenter:', segment);
  });

  peaksInstance.on('segments.mouseleave', function(segment) {
    console.log('segments.mouseleave:', segment);
  });

  peaksInstance.on('segments.click', function(segment) {
    console.log('segments.click:', segment);
  });

  peaksInstance.on('segments.dblclick', function(segment) {
    console.log('segments.dblclick:', segment);
  });

  peaksInstance.on('zoomview.click', function(time) {
    console.log('zoomview.click:', time);
  });

  peaksInstance.on('zoomview.dblclick', function(time) {
    console.log('zoomview.dblclick:', time);
  });

  peaksInstance.on('overview.click', function(time) {
    console.log('overview.click:', time);
  });

  peaksInstance.on('overview.dblclick', function(time) {
    console.log('overview.dblclick:', time);
  });
});
