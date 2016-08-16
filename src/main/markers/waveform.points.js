/**
 * WAVEFORM.POINTS.JS
 *
 * This module handles all functionality related to the adding,
 * removing and manipulation of points. A point in a segment of zero length
 */
define([
  'peaks/waveform/waveform.mixins',
  'konva'
], function(mixins, Konva) {
  'use strict';

  return function(peaks) {
    var self = this;
    var waveformView = peaks.waveform;

    self.points = [];

    var views = [
      waveformView.waveformZoomView,
      waveformView.waveformOverview
    ];

    self.views = views.map(function(view) {
      if (!view.pointLayer) {
        view.pointLayer = new Konva.Layer();
        view.stage.add(view.pointLayer);
        view.pointLayer.moveToTop();
      }

      return view;
    });

    var pointId = 0;

    function constructPoint(point) {
      if (point.id === undefined || point.id === null) {
        point.id = 'peaks.point.' + pointId++;
      }

      point.editable = Boolean(point.editable);

      var pointZoomGroup = new Konva.Group();
      var pointOverviewGroup = new Konva.Group();
      var pointGroups = [pointZoomGroup, pointOverviewGroup];

      pointGroups.forEach(function(pointGroup, i) {
        var view = self.views[i];

        if (point.editable) {
          pointGroup.marker = new peaks.options.pointMarker(
            true,
            pointGroup,
            point,
            pointHandleDrag,
            peaks.options.pointDblClickHandler,
            peaks.options.pointDragEndHandler
          );

          pointGroup.add(pointGroup.marker);
        }

        view.pointLayer.add(pointGroup);
      });

      point.zoom = pointZoomGroup;
      point.zoom.view = waveformView.waveformZoomView;
      point.overview = pointOverviewGroup;
      point.overview.view = waveformView.waveformOverview;

      return point;
    }

    function updatePoint(point) {
      // Binding with data
      waveformView.waveformOverview.data.set_point(
        waveformView.waveformOverview.data.at_time(point.timestamp),
        point.id
      );

      waveformView.waveformZoomView.data.set_point(
        waveformView.waveformZoomView.data.at_time(point.timestamp),
        point.id
      );

      // Overview
      var overviewTimestampOffset =
        waveformView.waveformOverview.data.at_time(point.timestamp);

      if (point.editable) {
        if (point.overview.marker) {
          point.overview.marker.show().setX(
            overviewTimestampOffset - point.overview.marker.getWidth()
          );
        }

        // Change Text
        point.overview.marker.label.setText(mixins.niceTime(point.timestamp, false));
      }

      // Zoom
      var zoomTimestampOffset = waveformView.waveformZoomView.data.at_time(point.timestamp);
      var frameStartOffset = waveformView.waveformZoomView.frameOffset;

      if (zoomTimestampOffset < frameStartOffset) {
        zoomTimestampOffset = frameStartOffset;
      }

      if (waveformView.waveformZoomView.data.points[point.id].visible) {
        var startPixel = zoomTimestampOffset - frameStartOffset;

        point.zoom.show();

        if (point.editable) {
          if (point.zoom.marker) {
            point.zoom.marker.show().setX(startPixel - point.zoom.marker.getWidth());
          }

          // Change Text
          point.zoom.marker.label.setText(mixins.niceTime(point.timestamp, false));
        }
      }
      else {
        point.zoom.hide();
      }
    }

    function pointHandleDrag(thisPoint, point) {
      if (thisPoint.marker.getX() > 0) {
        var inOffset = thisPoint.view.frameOffset +
                       thisPoint.marker.getX() +
                       thisPoint.marker.getWidth();

        point.timestamp = thisPoint.view.data.time(inOffset);
      }

      updatePoint(point);
      self.render();
    }

    this.init = function() {
      peaks.on('waveform_zoom_displaying', self.updatePoints.bind(self));
      peaks.emit('points.ready');
    };

    this.updatePoints = function() {
      self.points.forEach(updatePoint);
      self.render();
    };

    this.createPoint = function(point) {
      if (typeof point.timestamp !== 'number') {
        throw new TypeError('[waveform.points.createPoint] timestamp should be a numeric value \'' + typeof point.timestamp + '\': ' + point.typestamp);
      }

      if (isNaN(point.timestamp)) {
        throw new TypeError('[waveform.points.createPoint] timestamp must be a numeric value');
      }

      if (point.timestamp < 0) {
        throw new RangeError('[waveform.points.createPoint] timestamp should be a >=0 value');
      }

      point = constructPoint(point);
      updatePoint(point);
      self.points.push(point);
    };

    this.getPoints = function getPoints() {
      return this.points;
    };

    this.add = function addPoint(pointOrPoints) {
      var points = Array.isArray(arguments[0]) ?
                   arguments[0] :
                   Array.prototype.slice.call(arguments);

      if (typeof points[0] === 'number') {
        peaks.options.deprecationLogger('[Peaks.points.add] Passing spread-arguments to `add` is deprecated, please pass a single object.');

        points = [{
          timestamp: arguments[0],
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
    this._remove = function _removePoint(point) {
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

    this.remove = function removePoint(point) {
      var index = this._remove(point);

      if (index === null) {
        throw new RangeError('Unable to find the requested point' + String(point));
      }

      this.render();

      return this.points.splice(index, 1).pop();
    };

    this.removeByTime = function removePointByTime(timestamp) {
      var matchingPoints = this.points.filter(function(point) {
        return point.timestamp === timestamp;
      });

      matchingPoints.forEach(this.remove.bind(this));

      return matchingPoints.length;
    };

    this.removeById = function removePointById(pointId) {
      this.points.filter(function(point) {
        return point.id === pointId;
      }).forEach(this.remove.bind(this));
    };

    this.removeAll = function removeAllPoints() {
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
    this.render = function renderPoints() {
      self.views.forEach(function(view) {
        view.pointLayer.draw();
      });
    };
  };
});
