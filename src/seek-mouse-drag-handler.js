/**
 * @file
 *
 * Defines the {@link SeekMouseDragHandler} class.
 *
 * @module seek-mouse-drag-handler
 */

import MouseDragHandler from './mouse-drag-handler';
import { clamp } from './utils';

/**
 * Creates a handler for mouse events to allow seeking the waveform
 * views by clicking and dragging the mouse.
 *
 * @class
 * @alias SeekMouseDragHandler
 *
 * @param {Peaks} peaks
 * @param {WaveformOverview} view
 */

function SeekMouseDragHandler(peaks, view) {
  this._peaks = peaks;
  this._view = view;

  this._onMouseDown = this._onMouseDown.bind(this);
  this._onMouseMove = this._onMouseMove.bind(this);

  this._mouseDragHandler = new MouseDragHandler(view._stage, {
    onMouseDown: this._onMouseDown,
    onMouseMove: this._onMouseMove
  });
}

SeekMouseDragHandler.prototype._onMouseDown = function(mousePosX) {
  this._seek(mousePosX);
};

SeekMouseDragHandler.prototype._onMouseMove = function(mousePosX) {
  this._seek(mousePosX);
};

SeekMouseDragHandler.prototype._seek = function(mousePosX) {
  if (!this._view.isSeekEnabled()) {
    return;
  }

  mousePosX = clamp(mousePosX, 0, this._width);

  let time = this._view.pixelsToTime(mousePosX);
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

SeekMouseDragHandler.prototype.destroy = function() {
  this._mouseDragHandler.destroy();
};

export default SeekMouseDragHandler;
