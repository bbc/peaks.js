/**
 * @file
 *
 * Defines the {@link PointsLayer} class.
 *
 * @module points-layer
 */

import PointMarker from './point-marker';
import { clamp, objectHasProperty } from './utils';
import Konva from 'konva/lib/Core';

const defaultFontFamily = 'sans-serif';
const defaultFontSize = 10;
const defaultFontShape = 'normal';

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

  this._onPointMarkerDragStart   = this._onPointMarkerDragStart.bind(this);
  this._onPointMarkerDragMove    = this._onPointMarkerDragMove.bind(this);
  this._onPointMarkerDragEnd     = this._onPointMarkerDragEnd.bind(this);
  this._pointMarkerDragBoundFunc = this._pointMarkerDragBoundFunc.bind(this);
  this._onPointMarkerMouseEnter  = this._onPointMarkerMouseEnter.bind(this);
  this._onPointMarkerMouseLeave  = this._onPointMarkerMouseLeave.bind(this);

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

PointsLayer.prototype.getPointMarker = function(point) {
  return this._pointMarkers[point.pid];
};

PointsLayer.prototype.formatTime = function(time) {
  return this._view.formatTime(time);
};

PointsLayer.prototype._onPointsUpdate = function(point, options) {
  const frameStartTime = this._view.getStartTime();
  const frameEndTime   = this._view.getEndTime();

  const pointMarker = this.getPointMarker(point);
  const isVisible = point.isVisible(frameStartTime, frameEndTime);

  if (pointMarker && !isVisible) {
    // Remove point marker that is no longer visible.
    this._removePoint(point);
  }
  else if (!pointMarker && isVisible) {
    // Add point marker for visible point.
    this._updatePoint(point);
  }
  else if (pointMarker && isVisible) {
    // Update the point marker with the changed attributes.
    if (objectHasProperty(options, 'time')) {
      const pointMarkerOffset = this._view.timeToPixels(point.time);

      const pointMarkerX = pointMarkerOffset - this._view.getFrameOffset();

      pointMarker.setX(pointMarkerX);
    }

    pointMarker.update(options);
  }
};

PointsLayer.prototype._onPointsAdd = function(event) {
  const self = this;

  const frameStartTime = self._view.getStartTime();
  const frameEndTime   = self._view.getEndTime();

  event.points.forEach(function(point) {
    if (point.isVisible(frameStartTime, frameEndTime)) {
      self._updatePoint(point);
    }
  });
};

PointsLayer.prototype._onPointsRemove = function(event) {
  const self = this;

  event.points.forEach(function(point) {
    self._removePoint(point);
  });
};

PointsLayer.prototype._onPointsRemoveAll = function() {
  this._layer.removeChildren();
  this._pointMarkers = {};
};

/**
 * Creates the Konva UI objects for a given point.
 *
 * @private
 * @param {Point} point
 * @returns {PointMarker}
 */

PointsLayer.prototype._createPointMarker = function(point) {
  const editable = this._allowEditing && point.editable;

  const marker = this._peaks.options.createPointMarker({
    point:      point,
    editable:   editable,
    color:      point.color,
    fontFamily: this._peaks.options.fontFamily || defaultFontFamily,
    fontSize:   this._peaks.options.fontSize || defaultFontSize,
    fontStyle:  this._peaks.options.fontStyle || defaultFontShape,
    layer:      this,
    view:       this._view.getName()
  });

  return new PointMarker({
    point:         point,
    draggable:     editable,
    marker:        marker,
    onDragStart:   this._onPointMarkerDragStart,
    onDragMove:    this._onPointMarkerDragMove,
    onDragEnd:     this._onPointMarkerDragEnd,
    dragBoundFunc: this._pointMarkerDragBoundFunc,
    onMouseEnter:  this._onPointMarkerMouseEnter,
    onMouseLeave:  this._onPointMarkerMouseLeave
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
  const pointMarker = this._createPointMarker(point);

  this._pointMarkers[point.pid] = pointMarker;

  pointMarker.addToLayer(this._layer);

  return pointMarker;
};

PointsLayer.prototype._onPointsDrag = function(event) {
  const pointMarker = this._updatePoint(event.point);

  pointMarker.update({ time: event.point.time });
};

/**
 * @param {KonvaEventObject} event
 * @param {Point} point
 */

PointsLayer.prototype._onPointMarkerMouseEnter = function(event, point) {
  this._peaks.emit('points.mouseenter', {
    point: point,
    evt: event.evt
  });
};

/**
 * @param {KonvaEventObject} event
 * @param {Point} point
 */

PointsLayer.prototype._onPointMarkerMouseLeave = function(event, point) {
  this._peaks.emit('points.mouseleave', {
    point: point,
    evt: event.evt
  });
};

/**
 * @param {KonvaEventObject} event
 * @param {Point} point
 */

PointsLayer.prototype._onPointMarkerDragStart = function(event, point) {
  this._dragPointMarker = this.getPointMarker(point);

  this._peaks.emit('points.dragstart', {
    point: point,
    evt: event.evt
  });
};

/**
 * @param {KonvaEventObject} event
 * @param {Point} point
 */

PointsLayer.prototype._onPointMarkerDragMove = function(event, point) {
  const pointMarker = this._pointMarkers[point.pid];

  const markerX = pointMarker.getX();

  const offset = markerX + pointMarker.getWidth();

  point._setTime(this._view.pixelOffsetToTime(offset));

  this._peaks.emit('points.dragmove', {
    point: point,
    evt: event.evt
  });
};

/**
 * @param {KonvaEventObject} event
 * @param {Point} point
 */

PointsLayer.prototype._onPointMarkerDragEnd = function(event, point) {
  this._dragPointMarker = null;

  this._peaks.emit('points.dragend', {
    point: point,
    evt: event.evt
  });
};

PointsLayer.prototype._pointMarkerDragBoundFunc = function(pos) {
  // Allow the marker to be moved horizontally but not vertically.
  return {
    x: clamp(pos.x, 0, this._view.getWidth()),
    y: this._dragPointMarker.getAbsolutePosition().y
  };
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
  const points = this._peaks.points.find(startTime, endTime);

  points.forEach(this._updatePoint.bind(this));

  // TODO: In the overview all points are visible, so no need to do this.
  this._removeInvisiblePoints(startTime, endTime);
};

/**
 * @private
 * @param {Point} point
 */

PointsLayer.prototype._updatePoint = function(point) {
  let pointMarker = this.getPointMarker(point);

  if (!pointMarker) {
    pointMarker = this._addPointMarker(point);
  }

  const pointMarkerOffset = this._view.timeToPixels(point.time);
  const pointMarkerX = pointMarkerOffset - this._view.getFrameOffset();

  pointMarker.setX(pointMarkerX);

  return pointMarker;
};

/**
 * Remove any points that are not visible, i.e., are outside the given time
 * range.
 *
 * @private
 * @param {Number} startTime The start of the visible time range, in seconds.
 * @param {Number} endTime The end of the visible time range, in seconds.
 */

PointsLayer.prototype._removeInvisiblePoints = function(startTime, endTime) {
  for (const pointPid in this._pointMarkers) {
    if (objectHasProperty(this._pointMarkers, pointPid)) {
      const point = this._pointMarkers[pointPid].getPoint();

      if (!point.isVisible(startTime, endTime)) {
        this._removePoint(point);
      }
    }
  }
};

/**
 * Removes the UI object for a given point.
 *
 * @private
 * @param {Point} point
 */

PointsLayer.prototype._removePoint = function(point) {
  const pointMarker = this.getPointMarker(point);

  if (pointMarker) {
    pointMarker.destroy();
    delete this._pointMarkers[point.pid];
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
  for (const pointPid in this._pointMarkers) {
    if (objectHasProperty(this._pointMarkers, pointPid)) {
      const pointMarker = this._pointMarkers[pointPid];

      pointMarker.fitToView();
    }
  }
};

PointsLayer.prototype.draw = function() {
  this._layer.draw();
};

export default PointsLayer;
