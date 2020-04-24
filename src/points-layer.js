/**
 * @file
 *
 * Defines the {@link PointsLayer} class.
 *
 * @module points-layer
 */

define([
  './point-marker',
  './utils',
  'konva'
], function(
    PointMarker,
    Utils,
    Konva) {
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
   */

  function PointsLayer(peaks, view, allowEditing) {
    this._peaks        = peaks;
    this._view         = view;
    this._allowEditing = allowEditing;
    this._pointMarkers = {};
    this._layer        = new Konva.Layer();

    this._onPointsDrag = this._onPointsDrag.bind(this);

    this._onPointHandleDblClick   = this._onPointHandleDblClick.bind(this);
    this._onPointHandleDragStart  = this._onPointHandleDragStart.bind(this);
    this._onPointHandleDragMove   = this._onPointHandleDragMove.bind(this);
    this._onPointHandleDragEnd    = this._onPointHandleDragEnd.bind(this);
    this._onPointHandleMouseEnter = this._onPointHandleMouseEnter.bind(this);
    this._onPointHandleMouseLeave = this._onPointHandleMouseLeave.bind(this);

    this._onPointsUpdate    = this._onPointsUpdate.bind(this);
    this._onPointsAdd       = this._onPointsAdd.bind(this);
    this._onPointsRemove    = this._onPointsRemove.bind(this);
    this._onPointsRemoveAll = this._onPointsRemoveAll.bind(this);

    this._peaks.on('points.update', this._onPointsUpdate);
    this._peaks.on('points.add', this._onPointsAdd);
    this._peaks.on('points.remove', this._onPointsRemove);
    this._peaks.on('points.remove_all', this._onPointsRemoveAll);

    this._peaks.on('points.dragstart', this._onPointsDrag);
    this._peaks.on('points.dragmove', this._onPointsDrag);
    this._peaks.on('points.dragend', this._onPointsDrag);
  }

  /**
   * Adds the layer to the given {Konva.Stage}.
   *
   * @param {Konva.Stage} stage
   */

  PointsLayer.prototype.addToStage = function(stage) {
    stage.add(this._layer);
  };

  PointsLayer.prototype.enableEditing = function(enable) {
    this._allowEditing = enable;
  };

  PointsLayer.prototype.formatTime = function(time) {
    return this._view.formatTime(time);
  };

  PointsLayer.prototype._onPointsUpdate = function(point) {
    var frameOffset = this._view.getFrameOffset();
    var width = this._view.getWidth();

    var frameStartTime = this._view.pixelsToTime(frameOffset);
    var frameEndTime   = this._view.pixelsToTime(frameOffset + width);

    this._removePoint(point);

    if (point.isVisible(frameStartTime, frameEndTime)) {
      this._addPointMarker(point);
    }

    this.updatePoints(frameStartTime, frameEndTime);
  };

  PointsLayer.prototype._onPointsAdd = function(points) {
    var self = this;

    var frameOffset = self._view.getFrameOffset();
    var width = self._view.getWidth();

    var frameStartTime = self._view.pixelsToTime(frameOffset);
    var frameEndTime   = self._view.pixelsToTime(frameOffset + width);

    points.forEach(function(point) {
      if (point.isVisible(frameStartTime, frameEndTime)) {
        self._addPointMarker(point);
      }
    });

    self.updatePoints(frameStartTime, frameEndTime);
  };

  PointsLayer.prototype._onPointsRemove = function(points) {
    var self = this;

    points.forEach(function(point) {
      self._removePoint(point);
    });

    self._layer.draw();
  };

  PointsLayer.prototype._onPointsRemoveAll = function() {
    this._layer.removeChildren();
    this._pointMarkers = {};

    this._layer.draw();
  };

  PointsLayer.prototype._onPointsDrag = function(point) {
    this._updatePoint(point);
    this._layer.draw();
  };

  /**
   * Creates the Konva UI objects for a given point.
   *
   * @private
   * @param {Point} point
   * @returns {PointMarker}
   */

  PointsLayer.prototype._createPointMarker = function(point) {
    var editable = this._allowEditing && point.editable;

    var marker = this._peaks.options.createPointMarker({
      point:     point,
      draggable: editable,
      color:     point.color ? point.color : this._peaks.options.pointMarkerColor,
      layer:     this,
      view:      this._view.getName()
    });

    return new PointMarker({
      point:        point,
      draggable:    editable,
      marker:       marker,
      onDblClick:   this._onPointHandleDblClick,
      onDragStart:  this._onPointHandleDragStart,
      onDragMove:   this._onPointHandleDragMove,
      onDragEnd:    this._onPointHandleDragEnd,
      onMouseEnter: this._onPointHandleMouseEnter,
      onMouseLeave: this._onPointHandleMouseLeave
    });
  };

  PointsLayer.prototype.getHeight = function() {
    return this._view.getHeight();
  };

  /**
   * Adds a Konva UI object to the layer for a given point.
   *
   * @private
   * @param {Point} point
   * @returns {PointMarker}
   */

  PointsLayer.prototype._addPointMarker = function(point) {
    var pointMarker = this._createPointMarker(point);

    this._pointMarkers[point.id] = pointMarker;

    pointMarker.addToLayer(this._layer);

    return pointMarker;
  };

  /**
   * @param {Point} point
   */

  PointsLayer.prototype._onPointHandleDragMove = function(point) {
    var pointMarker = this._pointMarkers[point.id];

    var markerX = pointMarker.getX();

    if (markerX >= 0 && markerX < this._view.getWidth()) {
      var offset = this._view.getFrameOffset() +
                   markerX +
                   pointMarker.getWidth();

      point.time = this._view.pixelsToTime(offset);

      pointMarker.timeUpdated(point.time);
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

    // TODO: in the overview all points are visible, so no need to check
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
    var pointMarker = this._findOrAddPointMarker(point);

    var pointMarkerOffset = this._view.timeToPixels(point.time);

    var pointMarkerX = pointMarkerOffset - this._view.getFrameOffset();

    pointMarker.setX(pointMarkerX);
  };

  /**
   * @private
   * @param {Point} point
   * @return {PointMarker}
   */

  PointsLayer.prototype._findOrAddPointMarker = function(point) {
    var pointMarker = this._pointMarkers[point.id];

    if (!pointMarker) {
      pointMarker = this._addPointMarker(point);
    }

    return pointMarker;
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

    for (var pointId in this._pointMarkers) {
      if (Utils.objectHasProperty(this._pointMarkers, pointId)) {
        var point = this._pointMarkers[pointId].getPoint();

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
    var pointMarker = this._pointMarkers[point.id];

    if (pointMarker) {
      pointMarker.destroy();
      delete this._pointMarkers[point.id];
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

  PointsLayer.prototype.destroy = function() {
    this._peaks.off('points.update', this._onPointsUpdate);
    this._peaks.off('points.add', this._onPointsAdd);
    this._peaks.off('points.remove', this._onPointsRemove);
    this._peaks.off('points.remove_all', this._onPointsRemoveAll);
    this._peaks.off('points.dragstart', this._onPointsDrag);
    this._peaks.off('points.dragmove', this._onPointsDrag);
    this._peaks.off('points.dragend', this._onPointsDrag);
  };

  PointsLayer.prototype.fitToView = function() {
    for (var pointId in this._pointMarkers) {
      if (Utils.objectHasProperty(this._pointMarkers, pointId)) {
        var pointMarker = this._pointMarkers[pointId];

        pointMarker.fitToView();
      }
    }
  };

  PointsLayer.prototype.draw = function() {
    this._layer.draw();
  };

  return PointsLayer;
});
