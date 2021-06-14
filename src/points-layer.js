/**
 * @file
 *
 * Defines the {@link PointsLayer} class.
 *
 * @module points-layer
 */

import PointMarker from './point-marker.js';
import { objectHasProperty } from './utils.js';
import { Layer } from 'konva/lib/Layer';

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

export default class PointsLayer {
  constructor(peaks, view, allowEditing) {
    this._peaks        = peaks;
    this._view         = view;
    this._allowEditing = allowEditing;
    this._pointMarkers = {};
    this._layer        = new Layer();

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

  addToStage(stage) {
    stage.add(this._layer);
  }

  enableEditing(enable) {
    this._allowEditing = enable;
  }

  formatTime(time) {
    return this._view.formatTime(time);
  }

  _onPointsUpdate(point) {
    var frameOffset = this._view.getFrameOffset();
    var width = this._view.getWidth();

    var frameStartTime = this._view.pixelsToTime(frameOffset);
    var frameEndTime   = this._view.pixelsToTime(frameOffset + width);

    this._removePoint(point);

    if (point.isVisible(frameStartTime, frameEndTime)) {
      this._addPointMarker(point);
    }

    this.updatePoints(frameStartTime, frameEndTime);
  }

  _onPointsAdd(points) {
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
  }

  _onPointsRemove(points) {
    var self = this;

    points.forEach(function(point) {
      self._removePoint(point);
    });

    self._layer.draw();
  }

  _onPointsRemoveAll() {
    this._layer.removeChildren();
    this._pointMarkers = {};

    this._layer.draw();
  }

  _onPointsDrag(point) {
    this._updatePoint(point);
    this._layer.draw();
  }

  /**
   * Creates the Konva UI objects for a given point.
   *
   * @private
   * @param {Point} point
   * @returns {PointMarker}
   */

  _createPointMarker(point) {
    var editable = this._allowEditing && point.editable;

    var marker = this._peaks.options.createPointMarker({
      point:      point,
      draggable:  editable,
      color:      point.color ? point.color : this._peaks.options.pointMarkerColor,
      fontFamily:   this._peaks.options.fontFamily || defaultFontFamily,
      fontSize:     this._peaks.options.fontSize || defaultFontSize,
      fontStyle:    this._peaks.options.fontStyle || defaultFontShape,
      layer:      this,
      view:       this._view.getName()
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
  }

  getHeight() {
    return this._view.getHeight();
  }

  /**
   * Adds a Konva UI object to the layer for a given point.
   *
   * @private
   * @param {Point} point
   * @returns {PointMarker}
   */

  _addPointMarker(point) {
    var pointMarker = this._createPointMarker(point);

    this._pointMarkers[point.id] = pointMarker;

    pointMarker.addToLayer(this._layer);

    return pointMarker;
  }

  /**
   * @param {Point} point
   */

  _onPointHandleDragMove(point) {
    var pointMarker = this._pointMarkers[point.id];

    var markerX = pointMarker.getX();

    if (markerX >= 0 && markerX < this._view.getWidth()) {
      var offset = this._view.getFrameOffset() +
                   markerX +
                   pointMarker.getWidth();

      point._setTime(this._view.pixelsToTime(offset));

      pointMarker.timeUpdated(point.time);
    }

    this._peaks.emit('points.dragmove', point);
  }

  /**
   * @param {Point} point
   */

  _onPointHandleMouseEnter(point) {
    this._peaks.emit('points.mouseenter', point);
  }

  /**
   * @param {Point} point
   */

  _onPointHandleMouseLeave(point) {
    this._peaks.emit('points.mouseleave', point);
  }

  /**
   * @param {Point} point
   */

  _onPointHandleDblClick(point) {
    this._peaks.emit('points.dblclick', point);
  }

  /**
   * @param {Point} point
   */

  _onPointHandleDragStart(point) {
    this._peaks.emit('points.dragstart', point);
  }

  /**
   * @param {Point} point
   */

  _onPointHandleDragEnd(point) {
    this._peaks.emit('points.dragend', point);
  }

  /**
   * Updates the positions of all displayed points in the view.
   *
   * @param {Number} startTime The start of the visible range in the view,
   *   in seconds.
   * @param {Number} endTime The end of the visible range in the view,
   *   in seconds.
   */

  updatePoints(startTime, endTime) {
    // Update all points in the visible time range.
    var points = this._peaks.points.find(startTime, endTime);

    var count = points.length;

    points.forEach(this._updatePoint.bind(this));

    // TODO: in the overview all points are visible, so no need to check
    count += this._removeInvisiblePoints(startTime, endTime);

    if (count > 0) {
      this._layer.draw();
    }
  }

  /**
   * @private
   * @param {Point} point
   */

  _updatePoint(point) {
    var pointMarker = this._findOrAddPointMarker(point);

    var pointMarkerOffset = this._view.timeToPixels(point.time);

    var pointMarkerX = pointMarkerOffset - this._view.getFrameOffset();

    pointMarker.setX(pointMarkerX);
  }

  /**
   * @private
   * @param {Point} point
   * @return {PointMarker}
   */

  _findOrAddPointMarker(point) {
    var pointMarker = this._pointMarkers[point.id];

    if (!pointMarker) {
      pointMarker = this._addPointMarker(point);
    }

    return pointMarker;
  }

  /**
   * Remove any points that are not visible, i.e., are outside the given time
   * range.
   *
   * @private
   * @param {Number} startTime The start of the visible time range, in seconds.
   * @param {Number} endTime The end of the visible time range, in seconds.
   * @returns {Number} The number of points removed.
   */

  _removeInvisiblePoints(startTime, endTime) {
    var count = 0;

    for (var pointId in this._pointMarkers) {
      if (objectHasProperty(this._pointMarkers, pointId)) {
        var point = this._pointMarkers[pointId].getPoint();

        if (!point.isVisible(startTime, endTime)) {
          this._removePoint(point);
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Removes the UI object for a given point.
   *
   * @private
   * @param {Point} point
   */

  _removePoint(point) {
    var pointMarker = this._pointMarkers[point.id];

    if (pointMarker) {
      pointMarker.destroy();
      delete this._pointMarkers[point.id];
    }
  }

  /**
   * Toggles visibility of the points layer.
   *
   * @param {Boolean} visible
   */

  setVisible(visible) {
    this._layer.setVisible(visible);
  }

  destroy() {
    this._peaks.off('points.update', this._onPointsUpdate);
    this._peaks.off('points.add', this._onPointsAdd);
    this._peaks.off('points.remove', this._onPointsRemove);
    this._peaks.off('points.remove_all', this._onPointsRemoveAll);
    this._peaks.off('points.dragstart', this._onPointsDrag);
    this._peaks.off('points.dragmove', this._onPointsDrag);
    this._peaks.off('points.dragend', this._onPointsDrag);
  }

  fitToView() {
    for (var pointId in this._pointMarkers) {
      if (objectHasProperty(this._pointMarkers, pointId)) {
        var pointMarker = this._pointMarkers[pointId];

        pointMarker.fitToView();
      }
    }
  }

  draw() {
    this._layer.draw();
  }
}
