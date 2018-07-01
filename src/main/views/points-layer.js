/**
 * @file
 *
 * Defines the {@link PointsLayer} class.
 *
 * @module peaks/views/points-layer
 */

define([
  'peaks/waveform/waveform.utils',
  'konva'
  ], function(Utils, Konva) {
  'use strict';

  /**
   * Creates a Konva.Layer that displays point markers against the audio
   * waveform.
   *
   * @class
   * @alias PointsLayer
   *
   * @param {Peaks} peaks
   * @param {WaveformOverview|WaveformZoomView} view
   * @param {Boolean} allowEditing
   * @param {Boolean} showLabels
   */

  function PointsLayer(peaks, view, allowEditing, showLabels) {
    this._peaks        = peaks;
    this._view         = view;
    this._allowEditing = allowEditing;
    this._showLabels   = showLabels;
    this._pointGroups  = {};
    this._layer        = new Konva.Layer();

    this._registerEventHandlers();
  }

  /**
   * Adds the layer to the given {Konva.Stage}.
   *
   * @param {Konva.Stage} stage
   */

  PointsLayer.prototype.addToStage = function(stage) {
    stage.add(this._layer);
  };

  PointsLayer.prototype._registerEventHandlers = function() {
    var self = this;

    this._peaks.on('points.add', function(points) {
      var frameOffset = self._view.getFrameOffset();
      var width = self._view.getWidth();

      var frameStartTime = self._view.pixelsToTime(frameOffset);
      var frameEndTime   = self._view.pixelsToTime(frameOffset + width);

      points.forEach(function(point) {
        if (point.isVisible(frameStartTime, frameEndTime)) {
          self._addPointGroup(point);
        }
      });

      self.updatePoints(frameStartTime, frameEndTime);
    });

    this._peaks.on('points.remove', function(points) {
      points.forEach(function(point) {
        self._removePoint(point);
      });

      self._layer.draw();
    });

    this._peaks.on('points.remove_all', function() {
      self._layer.removeChildren();
      self._pointGroups = {};

      self._layer.draw();
    });

    var pointDragHandler = this._pointDragHandler.bind(this);

    this._peaks.on('points.dragstart', pointDragHandler);
    this._peaks.on('points.dragmove', pointDragHandler);
    this._peaks.on('points.dragend', pointDragHandler);
  };

  PointsLayer.prototype._pointDragHandler = function(point) {
    this._updatePoint(point);
    this._layer.draw();
  };

  /**
   * Creates the Konva UI objects for a given point.
   *
   * @private
   * @param {Point} point
   * @returns {Konva.Group}
   */

  PointsLayer.prototype._createPointGroup = function(point) {
    var pointGroup = new Konva.Group();

    pointGroup.point = point;

    var editable = this._allowEditing && point.editable;

    pointGroup.marker = this._peaks.options.createPointMarker({
      draggable:    editable,
      showLabel:    this._showLabels,
      handleColor:  point.color ? point.color : this._peaks.options.pointMarkerColor,
      height:       this._view.getHeight(),
      pointGroup:   pointGroup,
      point:        point,
      layer:        this._layer,
      onDblClick:   this._onPointHandleDblClick.bind(this),
      onDragStart:  this._onPointHandleDragStart.bind(this),
      onDragMove:   this._onPointHandleDragMove.bind(this),
      onDragEnd:    this._onPointHandleDragEnd.bind(this),
      onMouseEnter: this._onPointHandleMouseEnter.bind(this),
      onMouseLeave: this._onPointHandleMouseLeave.bind(this)
    });

    pointGroup.add(pointGroup.marker);

    return pointGroup;
  };

  /**
   * Adds a Konva UI object to the layer for a given point.
   *
   * @private
   * @param {Point} point
   * @returns {Konva.Group}
   */

  PointsLayer.prototype._addPointGroup = function(point) {
    var pointGroup = this._createPointGroup(point);

    this._pointGroups[point.id] = pointGroup;

    this._layer.add(pointGroup);

    return pointGroup;
  };

  /**
   * @param {Point} point
   */

  PointsLayer.prototype._onPointHandleDragMove = function(point) {
    var pointGroup = this._pointGroups[point.id];

    var markerX = pointGroup.marker.getX();

    if (markerX > 0 && markerX < this._view.getWidth()) {
      var offset = this._view.getFrameOffset() +
                   markerX +
                   pointGroup.marker.getWidth();

      point.time = this._view.pixelsToTime(offset);
    }

    this._peaks.emit('points.dragmove', point);
  };

  /**
   * @param {Point} point
   */

  PointsLayer.prototype._onPointHandleMouseEnter = function(point) {
    this._peaks.emit('points.mouseenter', point);
  };

  /**
   * @param {Point} point
   */

  PointsLayer.prototype._onPointHandleMouseLeave = function(point) {
    this._peaks.emit('points.mouseleave', point);
  };

  /**
   * @param {Point} point
   */

  PointsLayer.prototype._onPointHandleDblClick = function(point) {
    this._peaks.emit('points.dblclick', point);
  };

  /**
   * @param {Point} point
   */

  PointsLayer.prototype._onPointHandleDragStart = function(point) {
    this._peaks.emit('points.dragstart', point);
  };

  /**
   * @param {Point} point
   */

  PointsLayer.prototype._onPointHandleDragEnd = function(point) {
    this._peaks.emit('points.dragend', point);
  };

  /**
   * Updates the positions of all displayed points in the view.
   *
   * @param {Number} startTime The start of the visible range in the view,
   *   in seconds.
   * @param {Number} endTime The end of the visible range in the view,
   *   in seconds.
   */

  PointsLayer.prototype.updatePoints = function(startTime, endTime) {
    // Update all points in the visible time range.
    var points = this._peaks.points.find(startTime, endTime);

    var count = points.length;

    points.forEach(this._updatePoint.bind(this));

    // TODO: in the overview all segments are visible, so no need to check
    count += this._removeInvisiblePoints(startTime, endTime);

    if (count > 0) {
      this._layer.draw();
    }
  };

  /**
   * @private
   * @param {Point} point
   */

  PointsLayer.prototype._updatePoint = function(point) {
    var pointGroup = this._findOrAddPointGroup(point);

    // Point is visible
    var timestampOffset = this._view.timeToPixels(point.time);

    var startPixel = timestampOffset - this._view.getFrameOffset();

    if (pointGroup.marker) {
      pointGroup.marker.setX(startPixel);

      if (pointGroup.marker.time) {
        pointGroup.marker.time.setText(Utils.formatTime(point.time, false));
      }
    }
  };

  /**
   * @private
   * @param {Point} point
   */

  PointsLayer.prototype._findOrAddPointGroup = function(point) {
    var pointGroup = this._pointGroups[point.id];

    if (!pointGroup) {
      pointGroup = this._addPointGroup(point);
    }

    return pointGroup;
  };

  /**
   * Remove any points that are not visible, i.e., are outside the given time
   * range.
   *
   * @private
   * @param {Number} startTime The start of the visible time range, in seconds.
   * @param {Number} endTime The end of the visible time range, in seconds.
   * @returns {Number} The number of points removed.
   */

  PointsLayer.prototype._removeInvisiblePoints = function(startTime, endTime) {
    var count = 0;

    for (var pointId in this._pointGroups) {
      if (this._pointGroups.hasOwnProperty(pointId)) {
        var point = this._pointGroups[pointId].point;

        if (!point.isVisible(startTime, endTime)) {
          this._removePoint(point);
          count++;
        }
      }
    }

    return count;
  };

  /**
   * Removes the UI object for a given point.
   *
   * @private
   * @param {Point} point
   */

  PointsLayer.prototype._removePoint = function(point) {
    var pointGroup = this._pointGroups[point.id];

    if (pointGroup) {
      pointGroup.destroyChildren();
      pointGroup.destroy();
      delete this._pointGroups[point.id];
    }
  };

  /**
   * Toggles visibility of the points layer.
   *
   * @param {Boolean} visible
   */

  PointsLayer.prototype.setVisible = function(visible) {
    this._layer.setVisible(visible);
  };

  return PointsLayer;
});
