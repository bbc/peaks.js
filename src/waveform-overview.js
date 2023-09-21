/**
 * @file
 *
 * Defines the {@link WaveformOverview} class.
 *
 * @module waveform-overview
 */

import HighlightLayer from './highlight-layer';
import WaveformView from './waveform-view';
import SeekMouseDragHandler from './seek-mouse-drag-handler';

/**
 * Creates the overview waveform view.
 *
 * @class
 * @alias WaveformOverview
 *
 * @param {WaveformData} waveformData
 * @param {HTMLElement} container
 * @param {Peaks} peaks
 */

function WaveformOverview(waveformData, container, peaks) {
  const self = this;

  WaveformView.call(self, waveformData, container, peaks, peaks.options.overview);

  // Bind event handlers
  self._onTimeUpdate = self._onTimeUpdate.bind(self);
  self._onPlaying = self._onPlaying.bind(self);
  self._onPause = self._onPause.bind(self);
  self._onZoomviewDisplaying = self._onZoomviewDisplaying.bind(self);

  // Register event handlers
  peaks.on('player.timeupdate', self._onTimeUpdate);
  peaks.on('player.playing', self._onPlaying);
  peaks.on('player.pause', self._onPause);
  peaks.on('zoomview.displaying', self._onZoomviewDisplaying);

  const time = self._peaks.player.getCurrentTime();

  self._playheadLayer.updatePlayheadTime(time);

  self._mouseDragHandler = new SeekMouseDragHandler(peaks, self);
}

WaveformOverview.prototype = Object.create(WaveformView.prototype);

WaveformOverview.prototype.initWaveform = function() {
  if (this._width !== 0) {
    this._resampleAndSetWaveformData(this._originalWaveformData, this._width);
  }
};

WaveformOverview.prototype.initHighlightLayer = function() {
  this._highlightLayer = new HighlightLayer(
    this,
    this._viewOptions
  );

  this._highlightLayer.addToStage(this._stage);
};

WaveformOverview.prototype.isSegmentDraggingEnabled = function() {
  return false;
};

WaveformOverview.prototype.getName = function() {
  return 'overview';
};

WaveformOverview.prototype._onTimeUpdate = function(time) {
  this._playheadLayer.updatePlayheadTime(time);
};

WaveformOverview.prototype._onPlaying = function(time) {
  this._playheadLayer.updatePlayheadTime(time);
};

WaveformOverview.prototype._onPause = function(time) {
  this._playheadLayer.stop(time);
};

WaveformOverview.prototype._onZoomviewDisplaying = function(startTime, endTime) {
  this.showHighlight(startTime, endTime);
};

WaveformOverview.prototype.showHighlight = function(startTime, endTime) {
  this._highlightLayer.showHighlight(startTime, endTime);
};

WaveformOverview.prototype.setWaveformData = function(waveformData) {
  this._originalWaveformData = waveformData;

  if (this._width !== 0) {
    this._resampleAndSetWaveformData(waveformData, this._width);
  }
  else {
    this._data = waveformData;
  }

  this.updateWaveform();
};

WaveformOverview.prototype._resampleAndSetWaveformData = function(waveformData, width) {
  try {
    this._data = waveformData.resample({ width: width });
    return true;
  }
  catch (error) {
    // This error usually indicates that the waveform length
    // is less than the container width. Ignore, and use the
    // given waveform data
    this._data = waveformData;
    return false;
  }
};

WaveformOverview.prototype.removeHighlightRect = function() {
  this._highlightLayer.removeHighlight();
};

WaveformOverview.prototype.updateWaveform = function() {
  this._waveformLayer.draw();
  this._axisLayer.draw();

  const playheadTime = this._peaks.player.getCurrentTime();

  this._playheadLayer.updatePlayheadTime(playheadTime);

  this._highlightLayer.updateHighlight();

  const frameStartTime = 0;
  const frameEndTime   = this.pixelsToTime(this._width);

  if (this._pointsLayer) {
    this._pointsLayer.updatePoints(frameStartTime, frameEndTime);
  }

  if (this._segmentsLayer) {
    this._segmentsLayer.updateSegments(frameStartTime, frameEndTime);
  }
};

WaveformOverview.prototype.containerWidthChange = function() {
  return this._resampleAndSetWaveformData(this._originalWaveformData, this._width);
};

WaveformOverview.prototype.containerHeightChange = function() {
  this._highlightLayer.fitToView();
};

WaveformOverview.prototype.destroy = function() {
  // Unregister event handlers
  this._peaks.off('player.playing', this._onPlaying);
  this._peaks.off('player.pause', this._onPause);
  this._peaks.off('player.timeupdate', this._onTimeUpdate);
  this._peaks.off('zoomview.displaying', this._onZoomviewDisplaying);

  this._mouseDragHandler.destroy();

  WaveformView.prototype.destroy.call(this);
};

export default WaveformOverview;
