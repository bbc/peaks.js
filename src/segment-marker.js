/**
 * @file
 *
 * Defines the {@link SegmentMarker} class.
 *
 * @module segment-marker
 */

define([
  'konva'
], function(Konva) {
  'use strict';

  /**
   * Parameters for the {@link SegmentMarker} constructor.
   *
   * @typedef {Object} SegmentMarkerOptions
   * @global
   * @property {Segment} segment
   * @property {SegmentShape} segmentShape
   * @property {Boolean} draggable If true, marker is draggable.
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
    this._marker        = options.marker;
    this._segmentShape  = options.segmentShape;
    this._draggable     = options.draggable;
    this._layer         = options.layer;
    this._startMarker   = options.startMarker;

    this._onDrag      = options.onDrag;
    this._onDragStart = options.onDragStart;
    this._onDragEnd   = options.onDragEnd;

    this._dragBoundFunc = this._dragBoundFunc.bind(this);

    this._group = new Konva.Group({
      draggable:     this._draggable,
      dragBoundFunc: this._dragBoundFunc
    });

    this._bindDefaultEventHandlers();

    this._marker.init(this._group);
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
    var marker;
    var limit;

    if (this._startMarker) {
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

  SegmentMarker.prototype.fitToView = function() {
    this._marker.fitToView();
  };

  SegmentMarker.prototype.getSegment = function() {
    return this._segment;
  };

  SegmentMarker.prototype.getX = function() {
    return this._group.getX();
  };

  SegmentMarker.prototype.getWidth = function() {
    return this._group.getWidth();
  };

  SegmentMarker.prototype.isStartMarker = function() {
    return this._startMarker;
  };

  SegmentMarker.prototype.setX = function(x) {
    this._group.setX(x);
  };

  SegmentMarker.prototype.timeUpdated = function(time) {
    if (this._marker.timeUpdated) {
      this._marker.timeUpdated(time);
    }
  };

  SegmentMarker.prototype.destroy = function() {
    if (this._marker.destroy) {
      this._marker.destroy();
    }

    this._group.destroyChildren();
    this._group.destroy();
  };

  return SegmentMarker;
});
