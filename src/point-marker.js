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
 * @property {Boolean} draggable If true, marker is draggable.
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

  this._onClick       = options.onClick;
  this._onDblClick    = options.onDblClick;
  this._onDragStart   = options.onDragStart;
  this._onDragMove    = options.onDragMove;
  this._onDragEnd     = options.onDragEnd;
  this._dragBoundFunc = options.dragBoundFunc;
  this._onMouseEnter  = options.onMouseEnter;
  this._onMouseLeave  = options.onMouseLeave;
  this._onContextMenu = options.onContextMenu;

  this._group = new Konva.Group({
    name:          'marker',
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

  self._group.on('click', function(event) {
    self._onClick(event, self._point);
  });

  self._group.on('dblclick', function(event) {
    self._onDblClick(event, self._point);
  });

  self._group.on('mouseenter', function(event) {
    self._onMouseEnter(event, self._point);
  });

  self._group.on('mouseleave', function(event) {
    self._onMouseLeave(event, self._point);
  });

  self._group.on('contextmenu', function(event) {
    self._onContextMenu(event, self._point);
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

PointMarker.prototype.timeUpdated = function(time) {
  if (this._marker.timeUpdated) {
    this._marker.timeUpdated(time);
  }
};

PointMarker.prototype.update = function() {
  if (this._marker.update) {
    this._marker.update();
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
