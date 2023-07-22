/**
 * @file
 *
 * Defines the {@link PointMarker} class.
 *
 * @module point-marker
 */

import Konva from 'konva/lib/Core';

/**
 * Parameters for the {@link PointMarker} constructor.
 *
 * @typedef {Object} PointMarkerOptions
 * @global
 * @property {Point} point Point object with timestamp.
 * @property {Boolean} editable If true, marker is draggable.
 * @property {Marker} marker
 * @property {Function} onclick
 * @property {Function} onDblClick
 * @property {Function} onDragStart
 * @property {Function} onDragMove Callback during mouse drag operations.
 * @property {Function} onDragEnd
 * @property {Function} dragBoundFunc
 * @property {Function} onMouseEnter
 * @property {Function} onMouseLeave
 * @property {Function} onContextMenu
 */

/**
 * Creates a point marker handle.
 *
 * @class
 * @alias PointMarker
 *
 * @param {PointMarkerOptions} options
 */

function PointMarker(options) {
  this._point     = options.point;
  this._marker    = options.marker;
  this._draggable = options.draggable;

  this._onDragStart   = options.onDragStart;
  this._onDragMove    = options.onDragMove;
  this._onDragEnd     = options.onDragEnd;
  this._dragBoundFunc = options.dragBoundFunc;
  this._onMouseEnter  = options.onMouseEnter;
  this._onMouseLeave  = options.onMouseLeave;

  this._group = new Konva.Group({
    name:          'point-marker',
    point:         this._point,
    draggable:     this._draggable,
    dragBoundFunc: options.dragBoundFunc
  });

  this._bindDefaultEventHandlers();

  this._marker.init(this._group);
}

PointMarker.prototype._bindDefaultEventHandlers = function() {
  const self = this;

  self._group.on('dragstart', function(event) {
    self._onDragStart(event, self._point);
  });

  self._group.on('dragmove', function(event) {
    self._onDragMove(event, self._point);
  });

  self._group.on('dragend', function(event) {
    self._onDragEnd(event, self._point);
  });

  self._group.on('mouseenter', function(event) {
    self._onMouseEnter(event, self._point);
  });

  self._group.on('mouseleave', function(event) {
    self._onMouseLeave(event, self._point);
  });
};

/**
 * @param {Konva.Layer} layer
 */

PointMarker.prototype.addToLayer = function(layer) {
  layer.add(this._group);
};

PointMarker.prototype.fitToView = function() {
  this._marker.fitToView();
};

PointMarker.prototype.getPoint = function() {
  return this._point;
};

PointMarker.prototype.getX = function() {
  return this._group.getX();
};

PointMarker.prototype.setX = function(x) {
  this._group.setX(x);
};

PointMarker.prototype.getWidth = function() {
  return this._group.getWidth();
};

PointMarker.prototype.getAbsolutePosition = function() {
  return this._group.getAbsolutePosition();
};

PointMarker.prototype.update = function(options) {
  if (options.editable !== undefined) {
    this._group.draggable(options.editable);
  }

  if (this._marker.update) {
    this._marker.update(options);
  }
};

PointMarker.prototype.destroy = function() {
  if (this._marker.destroy) {
    this._marker.destroy();
  }

  this._group.destroyChildren();
  this._group.destroy();
};

export default PointMarker;
