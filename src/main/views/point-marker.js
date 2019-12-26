/**
 * @file
 *
 * Defines the {@link PointMarker} class.
 *
 * @module peaks/views/point-marker
 */

define([
  'konva'
  ], function(Konva) {
  'use strict';

  /**
   * Parameters for the {@link PointMarker} constructor and
   * {@link createPointMarker} function.
   *
   * @typedef {Object} PointMarkerOptions
   * @global
   * @property {Point} point Point object with timestamp.
   * @property {PointsLayer} layer
   * @property {Boolean} draggable If true, marker is draggable.
   * @property {String} color Color for the marker's handle and line.
   * @property {Boolean} showLabel If true, show the label text next to the marker.
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
    this._layer     = options.layer;
    this._draggable = options.draggable;
    this._color     = options.color;
    this._showLabel = options.showLabel;

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

    this._createMarker(this._group, options);
    this._bindDefaultEventHandlers();

    if (this._bindEventHandlers) {
      this._bindEventHandlers();
    }
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

  PointMarker.prototype.getPoint = function() {
    return this._point;
  };

  PointMarker.prototype.getX = function() {
    return this._group.getX();
  };

  PointMarker.prototype.getWidth = function() {
    return this._group.getWidth();
  };

  PointMarker.prototype.updatePosition = function(x) {
    this._group.setX(x);

    if (this._positionUpdated) {
      this._positionUpdated(x);
    }
  };

  PointMarker.prototype.destroy = function() {
    this._group.destroyChildren();
    this._group.destroy();
  };

  return PointMarker;
});
