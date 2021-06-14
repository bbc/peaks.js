/**
 * @file
 *
 * Defines the {@link SegmentMarker} class.
 *
 * @module segment-marker
 */

import { Group } from 'konva/lib/Group';

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

export default class SegmentMarker {
  constructor(options) {
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

    this._group = new Group({
      draggable:     this._draggable,
      dragBoundFunc: this._dragBoundFunc
    });

    this._bindDefaultEventHandlers();

    this._marker.init(this._group);
  }

  _bindDefaultEventHandlers() {
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
  }

  _dragBoundFunc(pos) {
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
  }

  addToLayer(layer) {
    layer.add(this._group);
  }

  fitToView() {
    this._marker.fitToView();
  }

  getSegment() {
    return this._segment;
  }

  getX() {
    return this._group.getX();
  }

  getWidth() {
    return this._group.getWidth();
  }

  isStartMarker() {
    return this._startMarker;
  }

  setX(x) {
    this._group.setX(x);
  }

  timeUpdated(time) {
    if (this._marker.timeUpdated) {
      this._marker.timeUpdated(time);
    }
  }

  destroy() {
    if (this._marker.destroy) {
      this._marker.destroy();
    }

    this._group.destroyChildren();
    this._group.destroy();
  }
}
