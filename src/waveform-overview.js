/**
 * @file
 *
 * Defines the {@link WaveformOverview} class.
 *
 * @module waveform-overview
 */

import HighlightLayer from './highlight-layer';
import MouseDragHandler from './mouse-drag-handler';
import PlayheadLayer from './playhead-layer';
import PointsLayer from './points-layer';
import SegmentsLayer from './segments-layer';
import WaveformAxis from './waveform-axis';
import WaveformShape from './waveform-shape';
import { clamp, formatTime, isFinite, isNumber } from './utils';
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
  self._onWindowResize = self._onWindowResize.bind(this);

  // Register event handlers
  peaks.on('player.timeupdate', self._onTimeUpdate);
  peaks.on('player.playing', self._onPlaying);
  peaks.on('player.pause', self._onPause);
  peaks.on('zoomview.displaying', self._onZoomviewDisplaying);
  peaks.on('window_resize', self._onWindowResize);

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
    try {
      self._data = waveformData.resample({ width: self._width });
    }
    catch (error) {
      // This error usually indicates that the waveform length
      // is less than the container width
    }
  }

  // Disable warning: The stage has 6 layers.
  // Recommended maximum number of layers is 3-5.
  Konva.showWarnings = false;

  self._resizeTimeoutId = null;

  self._stage = new Konva.Stage({
    container: container,
    width: self._width,
    height: self._height
  });

  self._waveformColor = self._viewOptions.waveformColor;
  self._playedWaveformColor = self._viewOptions.playedWaveformColor;

  self._createWaveform();

  self._segmentsLayer = new SegmentsLayer(peaks, self, false);
  self._segmentsLayer.addToStage(self._stage);

  self._pointsLayer = new PointsLayer(peaks, self, false);
  self._pointsLayer.addToStage(self._stage);

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

  this._playheadLayer.updatePlayheadTime(time);

  self._createMouseDragHandler();

  self._onClick = self._onClick.bind(this);
  self._onDblClick = self._onDblClick.bind(this);
  self._onContextMenu = self._onContextMenu.bind(this);

  self._stage.on('click', self._onClick);
  self._stage.on('dblclick', self._onDblClick);
  self._stage.on('contextmenu', self._onContextMenu);
}

WaveformOverview.prototype._createMouseDragHandler = function() {
  const self = this;

  self._mouseDragHandler = new MouseDragHandler(self._stage, {
    onMouseDown: function(mousePosX) {
      this._seek(mousePosX);
    },

    onMouseMove: function(mousePosX) {
      this._seek(mousePosX);
    },

    _seek: function(mousePosX) {
      if (!self._enableSeek) {
        return;
      }

      mousePosX = clamp(mousePosX, 0, self._width);

      let time = self.pixelsToTime(mousePosX);
      const duration = self._getDuration();

      // Prevent the playhead position from jumping by limiting click
      // handling to the waveform duration.
      if (time > duration) {
        time = duration;
      }

      // Update the playhead position. This gives a smoother visual update
      // than if we only use the player.timeupdate event.
      self._playheadLayer.updatePlayheadTime(time);

      self._peaks.player.seek(time);
    }
  });
};

WaveformOverview.prototype.enableSeek = function(enable) {
  this._enableSeek = enable;
};

WaveformOverview.prototype._onClick = function(event) {
  this._clickHandler(event, 'overview.click');
};

WaveformOverview.prototype._onDblClick = function(event) {
  this._clickHandler(event, 'overview.dblclick');
};

WaveformOverview.prototype._onContextMenu = function(event) {
  this._clickHandler(event, 'overview.contextmenu');
};

WaveformOverview.prototype._clickHandler = function(event, eventName) {
  const pixelIndex = event.evt.layerX;
  const time = this.pixelsToTime(pixelIndex);

  this._peaks.emit(eventName, {
    time: time,
    evt: event.evt
  });
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

WaveformOverview.prototype._onWindowResize = function() {
  const self = this;

  if (self._resizeTimeoutId) {
    clearTimeout(self._resizeTimeoutId);
    self._resizeTimeoutId = null;
  }

  // Avoid resampling waveform data to zero width
  if (self._container.clientWidth !== 0) {
    self._width = self._container.clientWidth;
    self._stage.setWidth(self._width);

    self._resizeTimeoutId = setTimeout(function() {
      self._width = self._container.clientWidth;
      self._data = self._originalWaveformData.resample({ width: self._width });
      self._stage.setWidth(self._width);

      self._updateWaveform();
    }, 500);
  }
};

WaveformOverview.prototype.setWaveformData = function(waveformData) {
  this._originalWaveformData = waveformData;

  if (this._width !== 0) {
    this._data = waveformData.resample({ width: this._width });
  }
  else {
    this._data = waveformData;
  }

  this._updateWaveform();
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
  this._segmentsLayer.draw();
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

  this._pointsLayer.updatePoints(frameStartTime, frameEndTime);
  this._segmentsLayer.updateSegments(frameStartTime, frameEndTime);
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

WaveformOverview.prototype.showAxisLabels = function(show) {
  this._axis.showAxisLabels(show);
  this._axisLayer.draw();
};

WaveformOverview.prototype.enableMarkerEditing = function(enable) {
  this._segmentsLayer.enableEditing(enable);
  this._pointsLayer.enableEditing(enable);
};

WaveformOverview.prototype.fitToContainer = function() {
  if (this._container.clientWidth === 0 && this._container.clientHeight === 0) {
    return;
  }

  let updateWaveform = false;

  if (this._container.clientWidth !== this._width) {
    this._width = this._container.clientWidth;
    this._stage.setWidth(this._width);

    try {
      this._data = this._originalWaveformData.resample({ width: this._width });
      updateWaveform = true;
    }
    catch (error) {
      // Ignore, and leave this._data as it was
    }
  }

  this._height = this._container.clientHeight;
  this._stage.setHeight(this._height);

  this._waveformShape.fitToView();
  this._playheadLayer.fitToView();
  this._segmentsLayer.fitToView();
  this._pointsLayer.fitToView();
  this._highlightLayer.fitToView();

  if (updateWaveform) {
    this._updateWaveform();
  }

  this._stage.draw();
};

WaveformOverview.prototype.getViewOptions = function() {
  return this._viewOptions;
};

WaveformOverview.prototype.destroy = function() {
  if (this._resizeTimeoutId) {
    clearTimeout(this._resizeTimeoutId);
    this._resizeTimeoutId = null;
  }

  this._peaks.off('player.playing', this._onPlaying);
  this._peaks.off('player.pause', this._onPause);
  this._peaks.off('player.timeupdate', this._onTimeUpdate);
  this._peaks.off('zoomview.displaying', this._onZoomviewDisplaying);
  this._peaks.off('window_resize', this._onWindowResize);

  this._playheadLayer.destroy();
  this._segmentsLayer.destroy();
  this._pointsLayer.destroy();

  if (this._stage) {
    this._stage.destroy();
    this._stage = null;
  }
};

export default WaveformOverview;
