/**
 * @file
 *
 * Defines the {@link PointMarker} class.
 *
 * @module point-marker
 */

define([
  'konva'
], function(Konva) {
  'use strict';

  /**
   * Parameters for the {@link PointMarker} constructor.
   *
   * @typedef {Object} PointMarkerOptions
   * @global
   * @property {Point} point Point object with timestamp.
   * @property {Boolean} draggable If true, marker is draggable.
   * @property {Marker} marker
   * @property {Function} onDblClick
   * @property {Function} onDragStart
   * @property {Function} onDragMove Callback during mouse drag operations.
   * @property {Function} onDragEnd
   * @property {Function} onMouseEnter
   * @property {Function} onMouseLeave
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

    this._onDblClick   = options.onDblClick;
    this._onDragStart  = options.onDragStart;
    this._onDragMove   = options.onDragMove;
    this._onDragEnd    = options.onDragEnd;
    this._onMouseEnter = options.onMouseEnter;
    this._onMouseLeave = options.onMouseLeave;

    this._dragBoundFunc = this._dragBoundFunc.bind(this);

    this._group = new Konva.Group({
      draggable:     this._draggable,
      dragBoundFunc: this._dragBoundFunc
    });

    this._bindDefaultEventHandlers();

    this._marker.init(this._group);
  }

  PointMarker.prototype._bindDefaultEventHandlers = function() {
    var self = this;

    self._group.on('dragstart', function() {
      self._onDragStart(self._point);
    });

    self._group.on('dragmove', function() {
      self._onDragMove(self._point);
    });

    self._group.on('dragend', function() {
      self._onDragEnd(self._point);
    });

    self._group.on('dblclick', function() {
      self._onDblClick(self._point);
    });

    self._group.on('mouseenter', function() {
      self._onMouseEnter(self._point);
    });

    self._group.on('mouseleave', function() {
      self._onMouseLeave(self._point);
    });
  };

  PointMarker.prototype._dragBoundFunc = function(pos) {
    // Allow the marker to be moved horizontally but not vertically.
    return {
      x: pos.x,
      y: this._group.getAbsolutePosition().y
    };
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

  PointMarker.prototype.getWidth = function() {
    return this._group.getWidth();
  };

  PointMarker.prototype.setX = function(x) {
    this._group.setX(x);
  };

  PointMarker.prototype.timeUpdated = function(time) {
    if (this._marker.timeUpdated) {
      this._marker.timeUpdated(time);
    }
  };

  PointMarker.prototype.destroy = function() {
    if (this._marker.destroy) {
      this._marker.destroy();
    }

    this._group.destroyChildren();
    this._group.destroy();
  };

  return PointMarker;
});
