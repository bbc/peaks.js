/**
 * @file
 *
 * Defines the {@link WaveformZoomView} class.
 *
 * @module waveform-zoomview
 */

import WaveformView from './waveform-view';
import InsertSegmentMouseDragHandler from './insert-segment-mouse-drag-handler';
import ScrollMouseDragHandler from './scroll-mouse-drag-handler';
import { clamp, isValidTime, objectHasProperty } from './utils';

/**
 * Creates a zoomable waveform view.
 *
 * @class
 * @alias WaveformZoomView
 *
 * @param {WaveformData} waveformData
 * @param {HTMLElement} container
 * @param {Peaks} peaks
 */

function WaveformZoomView(waveformData, container, peaks) {
  const self = this;

  WaveformView.call(self, waveformData, container, peaks, peaks.options.zoomview);

  // Bind event handlers
  self._onTimeUpdate = self._onTimeUpdate.bind(self);
  self._onPlaying = self._onPlaying.bind(self);
  self._onPause = self._onPause.bind(self);
  self._onKeyboardLeft = self._onKeyboardLeft.bind(self);
  self._onKeyboardRight = self._onKeyboardRight.bind(self);
  self._onKeyboardShiftLeft  = self._onKeyboardShiftLeft.bind(self);
  self._onKeyboardShiftRight = self._onKeyboardShiftRight.bind(self);

  // Register event handlers
  self._peaks.on('player.timeupdate', self._onTimeUpdate);
  self._peaks.on('player.playing', self._onPlaying);
  self._peaks.on('player.pause', self._onPause);
  self._peaks.on('keyboard.left', self._onKeyboardLeft);
  self._peaks.on('keyboard.right', self._onKeyboardRight);
  self._peaks.on('keyboard.shift_left', self._onKeyboardShiftLeft);
  self._peaks.on('keyboard.shift_right', self._onKeyboardShiftRight);

  self._autoScroll = self._viewOptions.autoScroll;
  self._autoScrollOffset = self._viewOptions.autoScrollOffset;

  self._enableSegmentDragging = false;
  self._segmentDragMode = 'overlap';
  self._minSegmentDragWidth = 0;
  self._insertSegmentShape = null;

  self._playheadClickTolerance = self._viewOptions.playheadClickTolerance;

  self._zoomLevelAuto = false;
  self._zoomLevelSeconds = null;

  const time = self._peaks.player.getCurrentTime();

  self._syncPlayhead(time);

  self._mouseDragHandler = new ScrollMouseDragHandler(peaks, self);

  self._onWheel = self._onWheel.bind(self);
  self._onWheelCaptureVerticalScroll = self._onWheelCaptureVerticalScroll.bind(self);
  self.setWheelMode(self._viewOptions.wheelMode);

  self._peaks.emit('zoomview.displaying', 0, self.getEndTime());
}

WaveformZoomView.prototype = Object.create(WaveformView.prototype);

WaveformZoomView.prototype.initWaveform = function() {
  this._enableWaveformCache = this._options.waveformCache;

  this._initWaveformCache();

  const initialZoomLevel = this._peaks.zoom.getZoomLevel();

  this._resampleData({ scale: initialZoomLevel });
};

WaveformZoomView.prototype._initWaveformCache = function() {
  if (this._enableWaveformCache) {
    this._waveformData = new Map();
    this._waveformData.set(this._originalWaveformData.scale, this._originalWaveformData);
    this._waveformScales = [this._originalWaveformData.scale];
  }
};

WaveformZoomView.prototype.initHighlightLayer = function() {
};

WaveformZoomView.prototype.setWheelMode = function(mode, options) {
  if (!options) {
    options = {};
  }

  if (mode !== this._wheelMode ||
      options.captureVerticalScroll !== this._captureVerticalScroll) {
    this._stage.off('wheel');

    this._wheelMode = mode;
    this._captureVerticalScroll = options.captureVerticalScroll;

    switch (mode) {
      case 'scroll':
        if (options.captureVerticalScroll) {
          this._stage.on('wheel', this._onWheelCaptureVerticalScroll);
        }
        else {
          this._stage.on('wheel', this._onWheel);
        }
        break;
    }
  }
};

WaveformZoomView.prototype._onWheel = function(event) {
  const wheelEvent = event.evt;
  let delta;

  if (wheelEvent.shiftKey) {
    if (wheelEvent.deltaY !== 0) {
      delta = wheelEvent.deltaY;
    }
    else if (wheelEvent.deltaX !== 0) {
      delta = wheelEvent.deltaX;
    }
    else {
      return;
    }
  }
  else {
    // Ignore the event if it looks like the user is scrolling vertically
    // down the page
    if (Math.abs(wheelEvent.deltaX) < Math.abs(wheelEvent.deltaY)) {
      return;
    }

    delta = wheelEvent.deltaX;
  }

  if (wheelEvent.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    delta *= this._width;
  }

  wheelEvent.preventDefault();

  const newFrameOffset = clamp(
    this._frameOffset + Math.floor(delta), 0, this._pixelLength - this._width
  );

  this.updateWaveform(newFrameOffset);
};

WaveformZoomView.prototype._onWheelCaptureVerticalScroll = function(event) {
  const wheelEvent = event.evt;

  const delta = Math.abs(wheelEvent.deltaX) < Math.abs(wheelEvent.deltaY) ?
    wheelEvent.deltaY : wheelEvent.deltaX;

  wheelEvent.preventDefault();

  const newFrameOffset = clamp(
    this._frameOffset + Math.floor(delta), 0, this._pixelLength - this._width
  );

  this.updateWaveform(newFrameOffset);
};

WaveformZoomView.prototype.setWaveformDragMode = function(mode) {
  if (this._viewOptions.enableSegments) {
    this._mouseDragHandler.destroy();

    if (mode === 'insert-segment') {
      this._mouseDragHandler = new InsertSegmentMouseDragHandler(this._peaks, this);
    }
    else {
      this._mouseDragHandler = new ScrollMouseDragHandler(this._peaks, this);
    }
  }
};

WaveformZoomView.prototype.enableSegmentDragging = function(enable) {
  this._enableSegmentDragging = enable;

  // Update all existing segments
  if (this._segmentsLayer) {
    this._segmentsLayer.enableSegmentDragging(enable);
  }
};

WaveformZoomView.prototype.isSegmentDraggingEnabled = function() {
  return this._enableSegmentDragging;
};

WaveformZoomView.prototype.setSegmentDragMode = function(mode) {
  this._segmentDragMode = mode;
};

WaveformZoomView.prototype.getSegmentDragMode = function() {
  return this._segmentDragMode;
};

WaveformZoomView.prototype.getName = function() {
  return 'zoomview';
};

WaveformZoomView.prototype._onTimeUpdate = function(time) {
  if (this._mouseDragHandler.isDragging()) {
    return;
  }

  this._syncPlayhead(time);
};

WaveformZoomView.prototype._onPlaying = function(time) {
  this._playheadLayer.updatePlayheadTime(time);
};

WaveformZoomView.prototype._onPause = function(time) {
  this._playheadLayer.stop(time);
};

WaveformZoomView.prototype._onKeyboardLeft = function() {
  this._keyboardScroll(-1, false);
};

WaveformZoomView.prototype._onKeyboardRight = function() {
  this._keyboardScroll(1, false);
};

WaveformZoomView.prototype._onKeyboardShiftLeft = function() {
  this._keyboardScroll(-1, true);
};

WaveformZoomView.prototype._onKeyboardShiftRight = function() {
  this._keyboardScroll(1, true);
};

WaveformZoomView.prototype._keyboardScroll = function(direction, large) {
  let increment;

  if (large) {
    increment = direction * this._width;
  }
  else {
    increment = direction * this.timeToPixels(this._options.nudgeIncrement);
  }

  this.scrollWaveform({ pixels: increment });
};

WaveformZoomView.prototype.setWaveformData = function(waveformData) {
  this._originalWaveformData = waveformData;
  // Clear cached waveforms
  this._initWaveformCache();

  // Don't update the UI here, call setZoom().
};

/**
 * Returns the position of the playhead marker, in pixels relative to the
 * left hand side of the waveform view.
 *
 * @return {Number}
 */

WaveformZoomView.prototype.getPlayheadOffset = function() {
  return this._playheadLayer.getPlayheadPixel() - this._frameOffset;
};

WaveformZoomView.prototype.getPlayheadClickTolerance = function() {
  return this._playheadClickTolerance;
};

WaveformZoomView.prototype._syncPlayhead = function(time) {
  this._playheadLayer.updatePlayheadTime(time);

  if (this._autoScroll) {
    // Check for the playhead reaching the right-hand side of the window.

    const pixelIndex = this.timeToPixels(time);

    // TODO: move this code to animation function?
    // TODO: don't scroll if user has positioned view manually (e.g., using
    // the keyboard)
    const endThreshold = this._frameOffset + this._width - this._autoScrollOffset;

    if (pixelIndex >= endThreshold || pixelIndex < this._frameOffset) {
      // Put the playhead at 100 pixels from the left edge
      this._frameOffset = pixelIndex - this._autoScrollOffset;

      if (this._frameOffset < 0) {
        this._frameOffset = 0;
      }

      this.updateWaveform(this._frameOffset);
    }
  }
};

WaveformZoomView.prototype._getScale = function(duration) {
  return Math.floor(duration * this._data.sample_rate / this._width);
};

function isAutoScale(options) {
  return ((objectHasProperty(options, 'scale') && options.scale === 'auto') ||
          (objectHasProperty(options, 'seconds') && options.seconds === 'auto'));
}

/**
 * Options for [WaveformZoomView.setZoom]{@link WaveformZoomView#setZoom}.
 *
 * @typedef {Object} SetZoomOptions
 * @global
 * @property {Number|String} scale Zoom level, in samples per pixel, or 'auto'
 *   to fit the entire waveform to the view width
 * @property {Number|String} seconds Number of seconds to fit to the view width,
 *   or 'auto' to fit the entire waveform to the view width
 */

/**
 * Changes the zoom level.
 *
 * @param {SetZoomOptions} options
 * @returns {Boolean}
 */

WaveformZoomView.prototype.setZoom = function(options) {
  let scale;

  if (isAutoScale(options)) {
    const seconds = this._peaks.player.getDuration();

    if (!isValidTime(seconds)) {
      return false;
    }

    this._zoomLevelAuto = true;
    this._zoomLevelSeconds = null;
    scale = this._getScale(seconds);
  }
  else {
    if (objectHasProperty(options, 'scale')) {
      this._zoomLevelSeconds = null;
      scale = Math.floor(options.scale);
    }
    else if (objectHasProperty(options, 'seconds')) {
      if (!isValidTime(options.seconds)) {
        return false;
      }

      this._zoomLevelSeconds = options.seconds;
      scale = this._getScale(options.seconds);
    }

    this._zoomLevelAuto = false;
  }

  if (scale < this._originalWaveformData.scale) {
    // eslint-disable-next-line max-len
    this._peaks._logger('peaks.zoomview.setZoom(): zoom level must be at least ' + this._originalWaveformData.scale);
    scale = this._originalWaveformData.scale;
  }

  const currentTime = this._peaks.player.getCurrentTime();
  let apexTime;
  let playheadOffsetPixels = this.getPlayheadOffset();

  if (playheadOffsetPixels >= 0 && playheadOffsetPixels < this._width) {
    // Playhead is visible. Change the zoom level while keeping the
    // playhead at the same position in the window.
    apexTime = currentTime;
  }
  else {
    // Playhead is not visible. Change the zoom level while keeping the
    // centre of the window at the same position in the waveform.
    playheadOffsetPixels = Math.floor(this._width / 2);
    apexTime = this.pixelOffsetToTime(playheadOffsetPixels);
  }

  const prevScale = this._scale;

  this._resampleData({ scale: scale });

  const apexPixel = this.timeToPixels(apexTime);

  this._frameOffset = apexPixel - playheadOffsetPixels;

  this.updateWaveform(this._frameOffset);

  this._playheadLayer.zoomLevelChanged();

  // Update the playhead position after zooming.
  this._playheadLayer.updatePlayheadTime(currentTime);

  this._peaks.emit('zoom.update', {
    currentZoom: scale,
    previousZoom: prevScale
  });

  return true;
};

WaveformZoomView.prototype._resampleData = function(options) {
  const scale = options.scale;

  if (this._enableWaveformCache) {
    if (!this._waveformData.has(scale)) {
      let sourceWaveform = this._originalWaveformData;

      // Resample from the next lowest available zoom level

      for (let i = 0; i < this._waveformScales.length; i++) {
        if (this._waveformScales[i] < scale) {
          sourceWaveform = this._waveformData.get(this._waveformScales[i]);
        }
        else {
          break;
        }
      }

      this._waveformData.set(scale, sourceWaveform.resample(options));

      this._waveformScales.push(scale);
      this._waveformScales.sort(function(a, b) {
        return a - b; // Ascending order
      });
    }

    this._data = this._waveformData.get(scale);
  }
  else {
    this._data = this._originalWaveformData.resample(options);
  }

  this._scale = this._data.scale;
  this._pixelLength = this._data.length;
};

WaveformZoomView.prototype.setStartTime = function(time) {
  if (time < 0) {
    time = 0;
  }

  if (this._zoomLevelAuto) {
    time = 0;
  }

  this.updateWaveform(this.timeToPixels(time));
};

/**
 * @returns {Number} The length of the waveform, in pixels.
 */

WaveformZoomView.prototype.getPixelLength = function() {
  return this._pixelLength;
};

/**
 * Scrolls the region of waveform shown in the view.
 *
 * @param {Number} scrollAmount How far to scroll, in pixels
 */

WaveformZoomView.prototype.scrollWaveform = function(options) {
  let scrollAmount;

  if (objectHasProperty(options, 'pixels')) {
    scrollAmount = Math.floor(options.pixels);
  }
  else if (objectHasProperty(options, 'seconds')) {
    scrollAmount = this.timeToPixels(options.seconds);
  }
  else {
    throw new TypeError('view.scrollWaveform(): Missing umber of pixels or seconds');
  }

  this.updateWaveform(this._frameOffset + scrollAmount);
};

/**
 * Updates the region of waveform shown in the view.
 *
 * @param {Number} frameOffset The new frame offset, in pixels.
 */

WaveformZoomView.prototype.updateWaveform = function(frameOffset) {
  let upperLimit;

  if (this._pixelLength < this._width) {
    // Total waveform is shorter than viewport, so reset the offset to 0.
    frameOffset = 0;
    upperLimit = this._width;
  }
  else {
    // Calculate the very last possible position.
    upperLimit = this._pixelLength - this._width;
  }

  frameOffset = clamp(frameOffset, 0, upperLimit);

  this._frameOffset = frameOffset;

  // Display playhead if it is within the zoom frame width.
  const playheadPixel = this._playheadLayer.getPlayheadPixel();

  this._playheadLayer.updatePlayheadTime(this.pixelsToTime(playheadPixel));

  this.drawWaveformLayer();
  this._axisLayer.draw();

  const frameStartTime = this.getStartTime();
  const frameEndTime   = this.getEndTime();

  if (this._pointsLayer) {
    this._pointsLayer.updatePoints(frameStartTime, frameEndTime);
  }

  if (this._segmentsLayer) {
    this._segmentsLayer.updateSegments(frameStartTime, frameEndTime);
  }

  this._peaks.emit('zoomview.displaying', frameStartTime, frameEndTime);
};

WaveformZoomView.prototype.enableAutoScroll = function(enable, options) {
  this._autoScroll = enable;

  if (objectHasProperty(options, 'offset')) {
    this._autoScrollOffset = options.offset;
  }
};

WaveformZoomView.prototype.getMinSegmentDragWidth = function() {
  return this._insertSegmentShape ? 0 : this._minSegmentDragWidth;
};

WaveformZoomView.prototype.setMinSegmentDragWidth = function(width) {
  this._minSegmentDragWidth = width;
};

WaveformZoomView.prototype.containerWidthChange = function() {
  let updateWaveform = false;

  let resample = false;
  let resampleOptions;

  if (this._zoomLevelAuto) {
    resample = true;
    resampleOptions = { width: this._width };
  }
  else if (this._zoomLevelSeconds !== null) {
    resample = true;
    resampleOptions = { scale: this._getScale(this._zoomLevelSeconds) };
  }

  if (resample) {
    try {
      this._resampleData(resampleOptions);
      updateWaveform = true;
    }
    catch (error) {
      // Ignore, and leave this._data as it was
    }
  }

  return updateWaveform;
};

WaveformZoomView.prototype.containerHeightChange = function() {
  // Nothing
};

WaveformZoomView.prototype.getStage = function() {
  return this._stage;
};

WaveformZoomView.prototype.getSegmentsLayer = function() {
  return this._segmentsLayer;
};

WaveformZoomView.prototype.destroy = function() {
  // Unregister event handlers
  this._peaks.off('player.playing', this._onPlaying);
  this._peaks.off('player.pause', this._onPause);
  this._peaks.off('player.timeupdate', this._onTimeUpdate);
  this._peaks.off('keyboard.left', this._onKeyboardLeft);
  this._peaks.off('keyboard.right', this._onKeyboardRight);
  this._peaks.off('keyboard.shift_left', this._onKeyboardShiftLeft);
  this._peaks.off('keyboard.shift_right', this._onKeyboardShiftRight);

  this._mouseDragHandler.destroy();

  WaveformView.prototype.destroy.call(this);
};

export default WaveformZoomView;
