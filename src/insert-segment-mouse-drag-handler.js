/**
 * @file
 *
 * Defines the {@link InsertSegmentMouseDragHandler} class.
 *
 * @module insert-segment-mouse-drag-handler
 */

import MouseDragHandler from './mouse-drag-handler';

/**
 * Creates a handler for mouse events to allow inserting new waveform
 * segments by clicking and dragging the mouse.
 *
 * @class
 * @alias InsertSegmentMouseDragHandler
 *
 * @param {Peaks} peaks
 * @param {WaveformZoomView} view
 */

function InsertSegmentMouseDragHandler(peaks, view) {
  this._peaks = peaks;
  this._view = view;

  this._onMouseDown = this._onMouseDown.bind(this);
  this._onMouseMove = this._onMouseMove.bind(this);
  this._onMouseUp = this._onMouseUp.bind(this);

  this._mouseDragHandler = new MouseDragHandler(view._stage, {
    onMouseDown: this._onMouseDown,
    onMouseMove: this._onMouseMove,
    onMouseUp: this._onMouseUp
  });
}

InsertSegmentMouseDragHandler.prototype.isDragging = function() {
  return this._mouseDragHandler.isDragging();
};

InsertSegmentMouseDragHandler.prototype._onMouseDown = function(mousePosX, segment) {
  this._segment = segment;

  if (this._segment) {
    // The user has clicked within a segment. We want to prevent
    // the segment from being dragged while the user inserts a new
    // segment. So we temporarily make the segment non-draggable,
    // and restore its draggable state in onMouseUp().
    this._segmentIsDraggable = this._segment.draggable();
    this._segment.draggable(false);
  }

  const time = this._view.pixelsToTime(mousePosX + this._view.getFrameOffset());

  this._peaks.segments.setInserting(true);

  this._insertSegment = this._peaks.segments.add({
    startTime: time,
    endTime: time,
    editable: true
  });

  this._insertSegmentShape = this._view._segmentsLayer.getSegmentShape(this._insertSegment);

  if (this._insertSegmentShape) {
    this._insertSegmentShape.moveMarkersToTop();
    this._insertSegmentShape.startDrag();
  }
};

InsertSegmentMouseDragHandler.prototype._onMouseMove = function() {
};

InsertSegmentMouseDragHandler.prototype._onMouseUp = function() {
  if (this._insertSegmentShape) {
    this._insertSegmentShape.stopDrag();
    this._insertSegmentShape = null;
  }

  // If the user was dragging within an existing segment,
  // restore the segment's original draggable state.
  if (this._segment && this._segmentIsDraggable) {
    this._segment.draggable(true);
  }

  this._peaks.emit('segments.insert', {
    segment: this._insertSegment
  });

  this._peaks.segments.setInserting(false);
};

InsertSegmentMouseDragHandler.prototype.destroy = function() {
  this._mouseDragHandler.destroy();
};

export default InsertSegmentMouseDragHandler;
