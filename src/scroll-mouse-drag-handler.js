/**
 * @file
 *
 * Defines the {@link ScrollMouseDragHandler} class.
 *
 * @module scroll-mouse-drag-handler
 */

import MouseDragHandler from './mouse-drag-handler';
import { clamp } from './utils';

/**
 * Creates a handler for mouse events to allow scrolling the zoomable
 * waveform view by clicking and dragging the mouse.
 *
 * @class
 * @alias ScrollMouseDragHandler
 *
 * @param {Peaks} peaks
 * @param {WaveformZoomView} view
 */

function ScrollMouseDragHandler(peaks, view) {
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

ScrollMouseDragHandler.prototype.isDragging = function() {
  return this._mouseDragHandler.isDragging();
};

ScrollMouseDragHandler.prototype._onMouseDown = function(mousePosX, segment) {
  this._segment = segment;
  this._seeking = false;

  const playheadOffset = this._view.getPlayheadOffset();

  if (this._view.isSeekEnabled() &&
      Math.abs(mousePosX - playheadOffset) <= this._view.getPlayheadClickTolerance()) {
    this._seeking = true;

    // The user has clicked near the playhead, and the playhead is within
    // a segment. In this case we want to allow the playhead to move, but
    // prevent the segment from being dragged. So we temporarily make the
    // segment non-draggable, and restore its draggable state in onMouseUp().
    if (this._segment) {
      this._segmentIsDraggable = this._segment.draggable();
      this._segment.draggable(false);
    }
  }

  if (this._seeking) {
    mousePosX = clamp(mousePosX, 0, this._view.getWidth());

    const time = this._view.pixelsToTime(mousePosX + this._view.getFrameOffset());

    this._seek(time);
  }
  else {
    this._initialFrameOffset = this._view.getFrameOffset();
    this._mouseDownX = mousePosX;
  }
};

ScrollMouseDragHandler.prototype._onMouseMove = function(mousePosX) {
  // Prevent scrolling the waveform if the user is dragging a segment.
  if (this._segment && !this._seeking) {
    return;
  }

  if (this._seeking) {
    mousePosX = clamp(mousePosX, 0, this._view.getWidth());

    const time = this._view.pixelsToTime(mousePosX + this._view.getFrameOffset());

    this._seek(time);
  }
  else {
    // Moving the mouse to the left increases the time position of the
    // left-hand edge of the visible waveform.
    const diff = this._mouseDownX - mousePosX;
    const newFrameOffset = this._initialFrameOffset + diff;

    if (newFrameOffset !== this._initialFrameOffset) {
      this._view.updateWaveform(newFrameOffset);
    }
  }
};

ScrollMouseDragHandler.prototype._onMouseUp = function() {
  if (!this._seeking) {
    // Set playhead position only on click release, when not dragging.
    if (this._view._enableSeek && !this._mouseDragHandler.isDragging()) {
      const time = this._view.pixelOffsetToTime(this._mouseDownX);

      this._seek(time);
    }
  }

  // If the user was dragging within an existing segment,
  // restore the segment's original draggable state.
  if (this._segment && this._seeking) {
    if (this._segmentIsDraggable) {
      this._segment.draggable(true);
    }
  }
};

ScrollMouseDragHandler.prototype._seek = function(time) {
  const duration = this._peaks.player.getDuration();

  // Prevent the playhead position from jumping by limiting click
  // handling to the waveform duration.
  if (time > duration) {
    time = duration;
  }

  // Update the playhead position. This gives a smoother visual update
  // than if we only use the player.timeupdate event.
  this._view.updatePlayheadTime(time);

  this._peaks.player.seek(time);
};

ScrollMouseDragHandler.prototype.destroy = function() {
  this._mouseDragHandler.destroy();
};

export default ScrollMouseDragHandler;
