/**
 * @file
 *
 * Defines the {@link SegmentMarker} class.
 *
 * @module peaks/views/segment-marker
 */

define([
  'konva'
  ], function(Konva) {
  'use strict';

  /**
   * Parameters for the {@link SegmentMarker} constructor and
   * {@link createSegmentMarker} function.
   *
   * @typedef {Object} SegmentMarkerOptions
   * @global
   * @property {Segment} segment
   * @property {SegmentShape} segmentShape
   * @property {Boolean} draggable If true, marker is draggable.
   * @property {String} color Colour hex value for handle and line marker.
   * @property {SegmentsLayer} layer
   * @property {Boolean} startMarker If <code>true</code>, the marker indicates
   *   the start time of the segment. If <code>false</code>, the marker
   *   indicates the end time of the segment.
   * @property {Function} onDrag
   * @property {Function} onDragStart
   * @property {Function} onDragEnd
   */

  /**
   * Creates a Left or Right side segment handle marker.
   *
   * @class
   * @alias SegmentMarker
   *
   * @param {SegmentMarkerOptions} options
   */

  function SegmentMarker(options) {
    this._segment       = options.segment;
    this._segmentShape  = options.segmentShape;
    this._draggable     = options.draggable;
    this._layer         = options.layer;
    this._isStartMarker = options.startMarker;

    this._onDrag      = options.onDrag;
    this._onDragStart = options.onDragStart;
    this._onDragEnd   = options.onDragEnd;

    this._dragBoundFunc = this._dragBoundFunc.bind(this);

    this._group = new Konva.Group({
      draggable:     this._draggable,
      dragBoundFunc: this._dragBoundFunc
    });

    this.createMarker(this._group, options);
    this._bindDefaultEventHandlers();

    if (this.bindEventHandlers) {
      this.bindEventHandlers();
    }
  }

  SegmentMarker.prototype._bindDefaultEventHandlers = function() {
    var self = this;

    if (self._draggable) {
      self._group.on('dragmove', function() {
        self._onDrag(self);
      });

      self._group.on('dragstart', function() {
        self._onDragStart(self);
      });

      self._group.on('dragend', function() {
        self._onDragEnd(self);
      });
    }
  };

  SegmentMarker.prototype._dragBoundFunc = function(pos) {
    var limit;
    var marker;

    if (this._isStartMarker) {
      marker = this._segmentShape.getEndMarker();
      limit  = marker.getX() - marker.getWidth();

      if (pos.x > limit) {
        pos.x = limit;
      }
    }
    else {
      marker = this._segmentShape.getStartMarker();
      limit  = marker.getX() + marker.getWidth();

      if (pos.x < limit) {
        pos.x = limit;
      }
    }

    return {
      x: pos.x,
      y: this._group.getAbsolutePosition().y
    };
  };

  SegmentMarker.prototype.addToLayer = function(layer) {
    layer.add(this._group);
  };

  SegmentMarker.prototype.getSegment = function() {
    return this._segment;
  };

  SegmentMarker.prototype.getGroup = function() {
    return this._group;
  };

  SegmentMarker.prototype.getLayer = function() {
    return this._layer;
  };

  SegmentMarker.prototype.getColor = function() {
    return this._color;
  };

  SegmentMarker.prototype.isStartMarker = function() {
    return this._isStartMarker;
  };

  SegmentMarker.prototype.updatePosition = function(x) {
    this._group.setX(x);

    if (this.positionUpdated) {
      this.positionUpdated(x);
    }
  };

  SegmentMarker.prototype.getX = function() {
    return this._group.getX();
  };

  SegmentMarker.prototype.getWidth = function() {
    return this._group.getWidth();
  };

  SegmentMarker.prototype.destroy = function() {
    if (this.destroyMarker) {
      this.destroyMarker();
    }

    this._group.destroyChildren();
    this._group.destroy();
  };

  return SegmentMarker;
});
