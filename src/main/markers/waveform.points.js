/**
 * @file
 *
 * Defines the {@link WaveformPoints} class.
 *
 * @module peaks/markers/waveform.points
 */
define([
  'peaks/waveform/waveform.utils',
  'konva'
], function(Utils, Konva) {
  'use strict';

  function getLabelText(point) {
    if (point.labelText) {
      return point.labelText;
    }
    else {
      return Utils.formatTime(point.time, false);
    }
  }

  /**
   * Handles all functionality related to the adding, removing and manipulation
   * of points. A point is a segment of zero length.
   *
   * @class
   * @alias WaveformPoints
   *
   * @param {Peaks} peaks The parent Peaks object.
   */
  function WaveformPoints(peaks) {
    var self = this;

    self.peaks = peaks;
    self.points = [];

    var views = [
      self.peaks.waveform.waveformZoomView,
      self.peaks.waveform.waveformOverview
    ];

    self.views = views.map(function(view) {
      if (!view.pointLayer) {
        view.pointLayer = new Konva.Layer();
        view.stage.add(view.pointLayer);
        view.pointLayer.moveToTop();
      }

      return view;
    });

    self._pointIdCounter = 0;
  }

  WaveformPoints.prototype.getNextPointId = function() {
    return 'peaks.point.' + this._pointIdCounter++;
  };

  WaveformPoints.prototype.constructPoint = function(point) {
    var self = this;

    if (point.id === undefined || point.id === null) {
      point.id = this.getNextPointId();
    }

    point.editable = Boolean(point.editable);

    var pointZoomGroup = new Konva.Group();
    var pointOverviewGroup = new Konva.Group();
    var pointGroups = [pointZoomGroup, pointOverviewGroup];

    pointGroups.forEach(function(pointGroup, i) {
      var view = self.views[i];
      var PointMarker = self.peaks.options.pointMarker;

      if (point.editable) {
        pointGroup.marker = new PointMarker(
          true,
          pointGroup,
          point,
          self.pointHandleDrag.bind(self),
          self.peaks.options.pointDblClickHandler,
          self.peaks.options.pointDragEndHandler
        );

        pointGroup.add(pointGroup.marker);
      }

      view.pointLayer.add(pointGroup);
    });

    point.zoom = pointZoomGroup;
    point.zoom.view = this.peaks.waveform.waveformZoomView;
    point.overview = pointOverviewGroup;
    point.overview.view = this.peaks.waveform.waveformOverview;

    return point;
  };

  WaveformPoints.prototype.updatePoint = function(point) {
    // Binding with data
    this.peaks.waveform.waveformOverview.data.set_point(
      this.peaks.waveform.waveformOverview.data.at_time(point.time),
      point.id
    );

    this.peaks.waveform.waveformZoomView.data.set_point(
      this.peaks.waveform.waveformZoomView.data.at_time(point.time),
      point.id
    );

    // Overview
    var overviewTimestampOffset =
      this.peaks.waveform.waveformOverview.data.at_time(point.time);

    if (point.editable) {
      if (point.overview.marker) {
        point.overview.marker.show().setX(
          overviewTimestampOffset - point.overview.marker.getWidth()
        );
      }

      // Change Text
      point.overview.marker.label.setText(getLabelText(point));
    }

    // Zoom
    var zoomTimestampOffset = this.peaks.waveform.waveformZoomView.data.at_time(point.time);
    var frameStartOffset = this.peaks.waveform.waveformZoomView.frameOffset;

    if (zoomTimestampOffset < frameStartOffset) {
      zoomTimestampOffset = frameStartOffset;
    }

    if (this.peaks.waveform.waveformZoomView.data.points[point.id].visible) {
      var startPixel = zoomTimestampOffset - frameStartOffset;

      point.zoom.show();

      if (point.editable) {
        if (point.zoom.marker) {
          point.zoom.marker.show().setX(startPixel - point.zoom.marker.getWidth());
        }

        // Change Text
        point.zoom.marker.label.setText(getLabelText(point));
      }
    }
    else {
      point.zoom.hide();
    }
  };

  /**
   * @param {Konva.Group} thisPoint
   * @param {Point} point
   */
  WaveformPoints.prototype.pointHandleDrag = function(thisPoint, point) {
    var markerX = thisPoint.marker.getX();

    if (markerX > 0 && markerX < thisPoint.view.width) {
      var offset = thisPoint.view.frameOffset +
                   markerX +
                   thisPoint.marker.getWidth();

      point.time = thisPoint.view.data.time(offset);
    }

    this.peaks.emit('points.dragged', point);
    this.updatePoint(point);
    this.render();
  };

  WaveformPoints.prototype.init = function() {
    this.peaks.on('zoomview.displaying', this.updatePoints.bind(this));
    this.peaks.emit('points.ready');
  };

  WaveformPoints.prototype.updatePoints = function() {
    this.points.forEach(this.updatePoint.bind(this));
    this.render();
  };

  WaveformPoints.prototype.createPoint = function(point) {
    if (point.hasOwnProperty('timestamp') || !point.hasOwnProperty('time')) {
      // eslint-disable-next-line max-len
      this.peaks.options.deprecationLogger("Passing a point with a 'timestamp' attribute is deprecated; please pass a 'time' attribute instead");
      point.time = point.timestamp;
    }

    if (typeof point.time !== 'number') {
      // eslint-disable-next-line max-len
      throw new TypeError('[waveform.points.createPoint] time should be a numeric value \'' + typeof point.time + '\': ' + point.time);
    }

    if (isNaN(point.time)) {
      // eslint-disable-next-line max-len
      throw new TypeError('[waveform.points.createPoint] time must be a numeric value');
    }

    if (point.time < 0) {
      // eslint-disable-next-line max-len
      throw new RangeError('[waveform.points.createPoint] time should be >=0');
    }

    // Set default label text
    if (point.labelText === undefined || point.labelText === null) {
      point.labelText = '';
    }

    point = this.constructPoint(point);
    this.updatePoint(point);
    this.points.push(point);
  };

  WaveformPoints.prototype.getPoints = function() {
    return this.points;
  };

  WaveformPoints.prototype.add = function(pointOrPoints) {
    var points = Array.isArray(arguments[0]) ?
                 arguments[0] :
                 Array.prototype.slice.call(arguments);

    if (typeof points[0] === 'number') {
      // eslint-disable-next-line max-len
      this.peaks.options.deprecationLogger('[Peaks.points.add] Passing spread-arguments to `add` is deprecated, please pass a single object.');

      points = [{
        time:      arguments[0],
        editable:  arguments[1],
        color:     arguments[2],
        labelText: arguments[3]
      }];
    }

    points.forEach(this.createPoint.bind(this));
    this.render();
  };

  /**
   * @private
   */
  WaveformPoints.prototype._remove = function(point) {
    var index = null;

    this.points.some(function(p, i) {
      if (p === point) {
        index = i;

        return true;
      }
    });

    if (index !== null) {
      point.overview.destroy();
      point.zoom.destroy();
    }

    return index;
  };

  WaveformPoints.prototype.remove = function(point) {
    var index = this._remove(point);

    if (index === null) {
      throw new RangeError('Unable to find the requested point' + String(point));
    }

    this.render();

    return this.points.splice(index, 1).pop();
  };

  WaveformPoints.prototype.removeByTime = function(time) {
    var matchingPoints = this.points.filter(function(point) {
      return point.time === time;
    });

    matchingPoints.forEach(this.remove.bind(this));

    return matchingPoints.length;
  };

  WaveformPoints.prototype.removeById = function(pointId) {
    this.points.filter(function(point) {
      return point.id === pointId;
    }).forEach(this.remove.bind(this));
  };

  WaveformPoints.prototype.removeAll = function() {
    this.views.forEach(function(view) {
      view.pointLayer.removeChildren();
    });

    this.points = [];

    this.render();
  };

  /**
   * Performs the rendering of the segments on screen
   *
   * @api
   * @since 0.3.0
   */
  WaveformPoints.prototype.render = function() {
    this.views.forEach(function(view) {
      view.pointLayer.draw();
    });
  };

  return WaveformPoints;
});
