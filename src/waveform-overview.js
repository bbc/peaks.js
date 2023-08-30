/**
 * @file
 *
 * Defines the {@link WaveformOverview} class.
 *
 * @module waveform-overview
 */

import HighlightLayer from './highlight-layer';
import PlayheadLayer from './playhead-layer';
import PointsLayer from './points-layer';
import SegmentsLayer from './segments-layer';
import WaveformAxis from './waveform-axis';
import WaveformShape from './waveform-shape';
import SeekMouseDragHandler from './seek-mouse-drag-handler';
import { formatTime, getMarkerObject, isFinite, isNumber } from './utils';

import Konva from 'konva/lib/Core';

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

  self._originalWaveformData = waveformData;
  self._container = container;
  self._peaks = peaks;
  self._options = peaks.options;
  self._viewOptions = peaks.options.overview;

  // Bind event handlers
  self._onTimeUpdate = self._onTimeUpdate.bind(this);
  self._onPlaying = self._onPlaying.bind(this);
  self._onPause = self._onPause.bind(this);
  self._onZoomviewDisplaying = self._onZoomviewDisplaying.bind(this);

  // Register event handlers
  peaks.on('player.timeupdate', self._onTimeUpdate);
  peaks.on('player.playing', self._onPlaying);
  peaks.on('player.pause', self._onPause);
  peaks.on('zoomview.displaying', self._onZoomviewDisplaying);

  self._amplitudeScale = 1.0;
  self._timeLabelPrecision = self._viewOptions.timeLabelPrecision;
  self._enableSeek = true;

  if (self._viewOptions.formatPlayheadTime) {
    self._formatPlayheadTime = self._viewOptions.formatPlayheadTime;
  }
  else {
    self._formatPlayheadTime = function(time) {
      return formatTime(time, self._timeLabelPrecision);
    };
  }

  self._width = container.clientWidth;
  self._height = container.clientHeight;

  self._data = waveformData;

  if (self._width !== 0) {
    self._resampleAndSetWaveformData(waveformData, self._width);
  }

  // Disable warning: The stage has 6 layers.
  // Recommended maximum number of layers is 3-5.
  Konva.showWarnings = false;

  self._stage = new Konva.Stage({
    container: container,
    width: self._width,
    height: self._height
  });

  self._waveformColor = self._viewOptions.waveformColor;
  self._playedWaveformColor = self._viewOptions.playedWaveformColor;

  self._createWaveform();

  if (self._viewOptions.enableSegments) {
    self._segmentsLayer = new SegmentsLayer(peaks, self, false);
    self._segmentsLayer.addToStage(self._stage);
  }

  if (self._viewOptions.enablePoints) {
    self._pointsLayer = new PointsLayer(peaks, self, false);
    self._pointsLayer.addToStage(self._stage);
  }

  self._highlightLayer = new HighlightLayer(
    self,
    self._viewOptions
  );
  self._highlightLayer.addToStage(self._stage);

  self._createAxisLabels();

  self._playheadLayer = new PlayheadLayer({
    player: self._peaks.player,
    view: self,
    showPlayheadTime: self._viewOptions.showPlayheadTime,
    playheadColor: self._viewOptions.playheadColor,
    playheadTextColor: self._viewOptions.playheadTextColor,
    playheadFontFamily: self._viewOptions.fontFamily,
    playheadFontSize: self._viewOptions.fontSize,
    playheadFontStyle: self._viewOptions.fontStyle
  });

  self._playheadLayer.addToStage(self._stage);

  const time = self._peaks.player.getCurrentTime();

  self._playheadLayer.updatePlayheadTime(time);

  self._mouseDragHandler = new SeekMouseDragHandler(peaks, self);

  self._onClick = self._onClick.bind(self);
  self._onDblClick = self._onDblClick.bind(self);
  self._onContextMenu = self._onContextMenu.bind(self);

  self._stage.on('click', self._onClick);
  self._stage.on('dblclick', self._onDblClick);
  self._stage.on('contextmenu', self._onContextMenu);
}

WaveformOverview.prototype.enableSeek = function(enable) {
  this._enableSeek = enable;
};

WaveformOverview.prototype.isSeekEnabled = function() {
  return this._enableSeek;
};

WaveformOverview.prototype._onClick = function(event) {
  this._clickHandler(event, 'click');
};

WaveformOverview.prototype._onDblClick = function(event) {
  this._clickHandler(event, 'dblclick');
};

WaveformOverview.prototype._onContextMenu = function(event) {
  this._clickHandler(event, 'contextmenu');
};

WaveformOverview.prototype._clickHandler = function(event, eventName) {
  let emitViewEvent = true;

  if (event.target !== this._stage) {
    const marker = getMarkerObject(event.target);

    if (marker) {
      if (marker.attrs.name === 'point-marker') {
        const point = marker.getAttr('point');

        if (point) {
          this._peaks.emit('points.' + eventName, {
            point: point,
            evt: event.evt,
            preventViewEvent: function() {
              emitViewEvent = false;
            }
          });
        }
      }
      else if (marker.attrs.name === 'segment-overlay') {
        const segment = marker.getAttr('segment');

        if (segment) {
          const clickEvent = {
            segment: segment,
            evt: event.evt,
            preventViewEvent: function() {
              emitViewEvent = false;
            }
          };

          if (this._segmentsLayer) {
            this._segmentsLayer.segmentClicked(eventName, clickEvent);
          }
        }
      }
    }
  }

  if (emitViewEvent) {
    const pixelIndex = event.evt.layerX;
    const time = this.pixelsToTime(pixelIndex);

    this._peaks.emit('overview.' + eventName, {
      time: time,
      evt: event.evt
    });
  }
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

WaveformOverview.prototype.updatePlayheadTime = function(time) {
  this._playheadLayer.updatePlayheadTime(time);
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

  this._updateWaveform();
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

WaveformOverview.prototype.playheadPosChanged = function(time) {
  if (this._playedWaveformShape) {
    this._playedSegment.endTime = time;
    this._unplayedSegment.startTime = time;

    this._waveformLayer.draw();
  }
};

/**
 * Returns the pixel index for a given time, for the current zoom level.
 *
 * @param {Number} time Time, in seconds.
 * @returns {Number} Pixel index.
 */

WaveformOverview.prototype.timeToPixels = function(time) {
  return Math.floor(time * this._data.sample_rate / this._data.scale);
};

WaveformOverview.prototype.timeToPixelOffset = WaveformOverview.prototype.timeToPixels;

/**
 * Returns the time for a given pixel index, for the current zoom level.
 *
 * @param {Number} pixels Pixel index.
 * @returns {Number} Time, in seconds.
 */

WaveformOverview.prototype.pixelsToTime = function(pixels) {
  return pixels * this._data.scale / this._data.sample_rate;
};

/**
 * Returns the time for a given pixel index, for the current zoom level.
 * (This is presented for symmetry with WaveformZoomview. Since WaveformOverview
 * doesn't scroll, its pixelOffsetToTime & pixelsToTime methods are identical.)
 *
 * @param {Number} pixels Pixel index.
 * @returns {Number} Time, in seconds.
 */

WaveformOverview.prototype.pixelOffsetToTime = WaveformOverview.prototype.pixelsToTime;

/**
 * @returns {Number} The start position of the waveform shown in the view,
 *   in pixels.
 */

WaveformOverview.prototype.getFrameOffset = function() {
  return 0;
};

/**
 * @returns {Number} The time at the leftmost edge
 */

WaveformOverview.prototype.getStartTime = function() {
  return 0;
};

/**
 * @returns {Number} The time at the rightmost edge
 */

WaveformOverview.prototype.getEndTime = function() {
  return this._getDuration();
};

/**
 * @returns {Number} The width of the view, in pixels.
 */

WaveformOverview.prototype.getWidth = function() {
  return this._width;
};

/**
 * @returns {Number} The height of the view, in pixels.
 */

WaveformOverview.prototype.getHeight = function() {
  return this._height;
};

/**
 * @returns {Number} The media duration, in seconds.
 */

WaveformOverview.prototype._getDuration = function() {
  return this._peaks.player.getDuration();
};

/**
 * Adjusts the amplitude scale of waveform shown in the view, which allows
 * users to zoom the waveform vertically.
 *
 * @param {Number} scale The new amplitude scale factor
 */

WaveformOverview.prototype.setAmplitudeScale = function(scale) {
  if (!isNumber(scale) || !isFinite(scale)) {
    throw new Error('view.setAmplitudeScale(): Scale must be a valid number');
  }

  this._amplitudeScale = scale;

  this._waveformLayer.draw();

  if (this._segmentsLayer) {
    this._segmentsLayer.draw();
  }
};

WaveformOverview.prototype.getAmplitudeScale = function() {
  return this._amplitudeScale;
};

/**
 * @returns {WaveformData} The view's waveform data.
 */

WaveformOverview.prototype.getWaveformData = function() {
  return this._data;
};

WaveformOverview.prototype._createWaveformShapes = function() {
  if (!this._waveformShape) {
    this._waveformShape = new WaveformShape({
      color: this._waveformColor,
      view: this
    });

    this._waveformShape.addToLayer(this._waveformLayer);
  }

  if (this._playedWaveformColor && !this._playedWaveformShape) {
    const time = this._peaks.player.getCurrentTime();

    this._playedSegment = {
      startTime: 0,
      endTime: time
    };

    this._unplayedSegment = {
      startTime: time,
      endTime: this._getDuration()
    };

    this._waveformShape.setSegment(this._unplayedSegment);

    this._playedWaveformShape = new WaveformShape({
      color: this._playedWaveformColor,
      view: this,
      segment: this._playedSegment
    });

    this._playedWaveformShape.addToLayer(this._waveformLayer);
  }
};

WaveformOverview.prototype._destroyPlayedWaveformShape = function() {
  this._waveformShape.setSegment(null);

  this._playedWaveformShape.destroy();
  this._playedWaveformShape = null;

  this._playedSegment = null;
  this._unplayedSegment = null;
};

WaveformOverview.prototype._createWaveform = function() {
  this._waveformLayer = new Konva.Layer({ listening: false });

  this._createWaveformShapes();

  this._stage.add(this._waveformLayer);
};

WaveformOverview.prototype._createAxisLabels = function() {
  this._axisLayer = new Konva.Layer({ listening: false });
  this._axis = new WaveformAxis(this, this._viewOptions);

  this._axis.addToLayer(this._axisLayer);
  this._stage.add(this._axisLayer);
};

WaveformOverview.prototype.removeHighlightRect = function() {
  this._highlightLayer.removeHighlight();
};

WaveformOverview.prototype._updateWaveform = function() {
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

WaveformOverview.prototype.setWaveformColor = function(color) {
  this._waveformColor = color;
  this._waveformShape.setWaveformColor(color);
};

WaveformOverview.prototype.setPlayedWaveformColor = function(color) {
  this._playedWaveformColor = color;

  if (color) {
    if (!this._playedWaveformShape) {
      this._createWaveformShapes();
    }

    this._playedWaveformShape.setWaveformColor(color);
  }
  else {
    if (this._playedWaveformShape) {
      this._destroyPlayedWaveformShape();
    }
  }
};

WaveformOverview.prototype.showPlayheadTime = function(show) {
  this._playheadLayer.showPlayheadTime(show);
};

WaveformOverview.prototype.setTimeLabelPrecision = function(precision) {
  this._timeLabelPrecision = precision;
  this._playheadLayer.updatePlayheadText();
};

WaveformOverview.prototype.formatTime = function(time) {
  return this._formatPlayheadTime(time);
};

WaveformOverview.prototype.showAxisLabels = function(show, options) {
  this._axis.showAxisLabels(show, options);
  this._axisLayer.draw();
};

WaveformOverview.prototype.enableMarkerEditing = function(enable) {
  if (this._segmentsLayer) {
    this._segmentsLayer.enableEditing(enable);
  }

  if (this._pointsLayer) {
    this._pointsLayer.enableEditing(enable);
  }
};

WaveformOverview.prototype.fitToContainer = function() {
  if (this._container.clientWidth === 0 && this._container.clientHeight === 0) {
    return;
  }

  let updateWaveform = false;

  if (this._container.clientWidth !== this._width) {
    this._width = this._container.clientWidth;
    this._stage.setWidth(this._width);

    if (this._resampleAndSetWaveformData(this._originalWaveformData, this._width)) {
      updateWaveform = true;
    }
  }

  if (this._container.clientHeight !== this._height) {
    this._height = this._container.clientHeight;
    this._stage.setHeight(this._height);

    this._waveformShape.fitToView();
    this._playheadLayer.fitToView();

    if (this._segmentsLayer) {
      this._segmentsLayer.fitToView();
    }

    if (this._pointsLayer) {
      this._pointsLayer.fitToView();
    }

    this._highlightLayer.fitToView();
  }

  if (updateWaveform) {
    this._updateWaveform();
  }
};

WaveformOverview.prototype.getViewOptions = function() {
  return this._viewOptions;
};

WaveformOverview.prototype.destroy = function() {
  this._peaks.off('player.playing', this._onPlaying);
  this._peaks.off('player.pause', this._onPause);
  this._peaks.off('player.timeupdate', this._onTimeUpdate);
  this._peaks.off('zoomview.displaying', this._onZoomviewDisplaying);

  this._mouseDragHandler.destroy();

  this._playheadLayer.destroy();

  if (this._segmentsLayer) {
    this._segmentsLayer.destroy();
  }

  if (this._pointsLayer) {
    this._pointsLayer.destroy();
  }

  if (this._stage) {
    this._stage.destroy();
    this._stage = null;
  }
};

export default WaveformOverview;
