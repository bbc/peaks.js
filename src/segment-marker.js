/**
 * @file
 *
 * Defines the {@link SegmentMarker} class.
 *
 * @module segment-marker
 */

import Konva from 'konva/lib/Core';

/**
 * Parameters for the {@link SegmentMarker} constructor.
 *
 * @typedef {Object} SegmentMarkerOptions
 * @global
 * @property {Segment} segment
 * @property {SegmentShape} segmentShape
 * @property {Boolean} editable If true, marker is draggable.
 * @property {Boolean} startMarker If <code>true</code>, the marker indicates
 *   the start time of the segment. If <code>false</code>, the marker
 *   indicates the end time of the segment.
 * @property {Function} onDragStart
 * @property {Function} onDragMove
 * @property {Function} onDragEnd
 * @property {Function} dragBoundFunc
 */

/**
 * Creates a segment handle marker for the start or end of a segment.
 *
 * @class
 * @alias SegmentMarker
 *
 * @param {SegmentMarkerOptions} options
 */

function SegmentMarker(options) {
  const self = this;

  self._segment       = options.segment;
  self._marker        = options.marker;
  self._segmentShape  = options.segmentShape;
  self._editable      = options.editable;
  self._startMarker   = options.startMarker;

  self._onDragStart   = options.onDragStart;
  self._onDragMove    = options.onDragMove;
  self._onDragEnd     = options.onDragEnd;

  self._group = new Konva.Group({
    name:          'segment-marker',
    segment:       self._segment,
    draggable:     self._editable,
    visible:       self._editable,
    dragBoundFunc: function(pos) {
      return options.dragBoundFunc(self, pos);
    }
  });

  self._bindDefaultEventHandlers();

  self._marker.init(self._group);
}

SegmentMarker.prototype._bindDefaultEventHandlers = function() {
  const self = this;

  self._group.on('dragstart', function(event) {
    self._onDragStart(self, event);
  });

  self._group.on('dragmove', function(event) {
    self._onDragMove(self, event);
  });

  self._group.on('dragend', function(event) {
    self._onDragEnd(self, event);
  });
};

SegmentMarker.prototype.addToLayer = function(layer) {
  layer.add(this._group);
};

SegmentMarker.prototype.moveToTop = function() {
  this._group.moveToTop();
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

SegmentMarker.prototype.setX = function(x) {
  this._group.setX(x);
};

SegmentMarker.prototype.getWidth = function() {
  return this._group.getWidth();
};

SegmentMarker.prototype.getAbsolutePosition = function() {
  return this._group.getAbsolutePosition();
};

SegmentMarker.prototype.isStartMarker = function() {
  return this._startMarker;
};

SegmentMarker.prototype.update = function(options) {
  if (options.editable !== undefined) {
    this._group.visible(options.editable);
    this._group.draggable(options.editable);
  }

  if (this._marker.update) {
    this._marker.update(options);
  }
};

SegmentMarker.prototype.destroy = function() {
  if (this._marker.destroy) {
    this._marker.destroy();
  }

  this._group.destroyChildren();
  this._group.destroy();
};

SegmentMarker.prototype.startDrag = function() {
  this._group.startDrag();
};

SegmentMarker.prototype.stopDrag = function() {
  this._group.stopDrag();
};

export default SegmentMarker;
