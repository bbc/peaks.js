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
import { Layer } from 'konva/lib/Layer';
import { Stage } from 'konva/lib/Stage';

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

export default class WaveformOverview {
  constructor(waveformData, container, peaks) {
    var self = this;

    self._originalWaveformData = waveformData;
    self._container = container;
    self._peaks = peaks;
    self._options = peaks.options;
    self._viewOptions = peaks.options.overview;

    // Bind event handlers
    self._onTimeUpdate = self._onTimeUpdate.bind(this);
    self._onPlay = self._onPlay.bind(this);
    self._onPause = self._onPause.bind(this);
    self._onZoomviewDisplaying = self._onZoomviewDisplaying.bind(this);
    self._onWindowResize = self._onWindowResize.bind(this);

    // Register event handlers
    peaks.on('player.timeupdate', self._onTimeUpdate);
    peaks.on('player.play', self._onPlay);
    peaks.on('player.pause', self._onPause);
    peaks.on('zoomview.displaying', self._onZoomviewDisplaying);
    peaks.on('window_resize', self._onWindowResize);

    self._amplitudeScale = 1.0;
    self._timeLabelPrecision = self._viewOptions.timeLabelPrecision;

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

    self._stage = new Stage({
      container: container,
      width: self._width,
      height: self._height
    });

    self._waveformLayer = new Layer({ listening: false });

    self._waveformColor = self._viewOptions.waveformColor;
    self._playedWaveformColor = self._viewOptions.playedWaveformColor;

    self._createWaveform();

    self._segmentsLayer = new SegmentsLayer(peaks, self, false);
    self._segmentsLayer.addToStage(self._stage);

    self._pointsLayer = new PointsLayer(peaks, self, false);
    self._pointsLayer.addToStage(self._stage);

    self._highlightLayer = new HighlightLayer(
      self,
      self._viewOptions.highlightOffset,
      self._viewOptions.highlightColor
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

    var time = self._peaks.player.getCurrentTime();

    this._playheadLayer.updatePlayheadTime(time);

    self._mouseDragHandler = new MouseDragHandler(self._stage, {
      onMouseDown(mousePosX) {
        mousePosX = clamp(mousePosX, 0, self._width);

        var time = self.pixelsToTime(mousePosX);
        var duration = self._getDuration();

        // Prevent the playhead position from jumping by limiting click
        // handling to the waveform duration.
        if (time > duration) {
          time = duration;
        }

        self._playheadLayer.updatePlayheadTime(time);

        peaks.player.seek(time);
      },

      onMouseMove(mousePosX) {
        mousePosX = clamp(mousePosX, 0, self._width);

        var time = self.pixelsToTime(mousePosX);
        var duration = self._getDuration();

        if (time > duration) {
          time = duration;
        }

        // Update the playhead position. This gives a smoother visual update
        // than if we only use the player.timeupdate event.
        self._playheadLayer.updatePlayheadTime(time);

        self._peaks.player.seek(time);
      }
    });

    this._stage.on('dblclick', function(event) {
      var pixelIndex = event.evt.layerX;

      var time = self.pixelsToTime(pixelIndex);

      self._peaks.emit('overview.dblclick', time);
    });
  }

  getName() {
    return 'overview';
  }

  _onTimeUpdate(time) {
    this._playheadLayer.updatePlayheadTime(time);
  }

  _onPlay(time) {
    this._playheadLayer.updatePlayheadTime(time);
  }

  _onPause(time) {
    this._playheadLayer.stop(time);
  }

  _onZoomviewDisplaying(startTime, endTime) {
    this.showHighlight(startTime, endTime);
  }

  showHighlight(startTime, endTime) {
    this._highlightLayer.showHighlight(startTime, endTime);
  }

  _onWindowResize() {
    var self = this;

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
  }

  setWaveformData(waveformData) {
    this._originalWaveformData = waveformData;

    if (this._width !== 0) {
      this._data = waveformData.resample({ width: this._width });
    }
    else {
      this._data = waveformData;
    }

    this._updateWaveform();
  }

  playheadPosChanged(time) {
    if (this._playedWaveformShape) {
      this._playedSegment.endTime = time;
      this._unplayedSegment.startTime = time;

      this._waveformLayer.draw();
    }
  }

  /**
   * Returns the pixel index for a given time, for the current zoom level.
   *
   * @param {Number} time Time, in seconds.
   * @returns {Number} Pixel index.
   */

  timeToPixels(time) {
    return Math.floor(time * this._data.sample_rate / this._data.scale);
  }

  /**
   * Returns the time for a given pixel index, for the current zoom level.
   *
   * @param {Number} pixels Pixel index.
   * @returns {Number} Time, in seconds.
   */

  pixelsToTime(pixels) {
    return pixels * this._data.scale / this._data.sample_rate;
  }

  /**
   * @returns {Number} The start position of the waveform shown in the view,
   *   in pixels.
   */

  getFrameOffset() {
    return 0;
  }

  /**
   * @returns {Number} The width of the view, in pixels.
   */

  getWidth() {
    return this._width;
  }

  /**
   * @returns {Number} The height of the view, in pixels.
   */

  getHeight() {
    return this._height;
  }

  /**
   * @returns {Number} The media duration, in seconds.
   */

  _getDuration() {
    return this._peaks.player.getDuration();
  }

  /**
   * Adjusts the amplitude scale of waveform shown in the view, which allows
   * users to zoom the waveform vertically.
   *
   * @param {Number} scale The new amplitude scale factor
   */

  setAmplitudeScale(scale) {
    if (!isNumber(scale) || !isFinite(scale)) {
      throw new Error('view.setAmplitudeScale(): Scale must be a valid number');
    }

    this._amplitudeScale = scale;

    this._waveformLayer.draw();
    this._segmentsLayer.draw();
  }

  getAmplitudeScale() {
    return this._amplitudeScale;
  }

  /**
   * @returns {WaveformData} The view's waveform data.
   */

  getWaveformData() {
    return this._data;
  }

  _createWaveformShapes() {
    if (!this._waveformShape) {
      this._waveformShape = new WaveformShape({
        color: this._waveformColor,
        view: this
      });

      this._waveformLayer.add(this._waveformShape);
    }

    if (this._playedWaveformColor && !this._playedWaveformShape) {
      var time = this._peaks.player.getCurrentTime();

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

      this._waveformLayer.add(this._playedWaveformShape);
    }
  }

  _destroyPlayedWaveformShape() {
    this._waveformShape.setSegment(null);

    this._playedWaveformShape.destroy();
    this._playedWaveformShape = null;

    this._playedSegment = null;
    this._unplayedSegment = null;
  }

  _createWaveform() {
    this._createWaveformShapes();

    this._stage.add(this._waveformLayer);
  }

  _createAxisLabels() {
    this._axisLayer = new Layer({ listening: false });

    this._axis = new WaveformAxis(this, {
      axisGridlineColor:   this._viewOptions.axisGridlineColor,
      axisLabelColor:      this._viewOptions.axisLabelColor,
      axisLabelFontFamily: this._viewOptions.fontFamily,
      axisLabelFontSize:   this._viewOptions.fontSize,
      axisLabelFontStyle:  this._viewOptions.fontStyle
    });

    this._axis.addToLayer(this._axisLayer);
    this._stage.add(this._axisLayer);
  }

  removeHighlightRect() {
    this._highlightLayer.removeHighlight();
  }

  _updateWaveform() {
    this._waveformLayer.draw();
    this._axisLayer.draw();

    var playheadTime = this._peaks.player.getCurrentTime();

    this._playheadLayer.updatePlayheadTime(playheadTime);

    this._highlightLayer.updateHighlight();

    var frameStartTime = 0;
    var frameEndTime   = this.pixelsToTime(this._width);

    this._pointsLayer.updatePoints(frameStartTime, frameEndTime);
    this._segmentsLayer.updateSegments(frameStartTime, frameEndTime);
  }

  setWaveformColor(color) {
    this._waveformColor = color;
    this._waveformShape.setWaveformColor(color);
    this._waveformLayer.draw();
  }

  setPlayedWaveformColor(color) {
    this._playedWaveformColor = color;

    if (color) {
      if (!this._playedWaveformShape) {
        this._createWaveformShapes();
      }

      this._playedWaveformShape.setWaveformColor(color);
      this._waveformLayer.draw();
    }
    else {
      if (this._playedWaveformShape) {
        this._destroyPlayedWaveformShape();
        this._waveformLayer.draw();
      }
    }
  }

  showPlayheadTime(show) {
    this._playheadLayer.showPlayheadTime(show);
  }

  setTimeLabelPrecision(precision) {
    this._timeLabelPrecision = precision;
    this._playheadLayer.updatePlayheadText();
  }

  formatTime(time) {
    return formatTime(time, this._timeLabelPrecision);
  }

  enableAutoScroll() {
    // The overview waveform doesn't support scrolling,
    // so nothing to do here.
  }

  enableMarkerEditing(enable) {
    this._segmentsLayer.enableEditing(enable);
    this._pointsLayer.enableEditing(enable);
  }

  fitToContainer() {
    if (this._container.clientWidth === 0 && this._container.clientHeight === 0) {
      return;
    }

    var updateWaveform = false;

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
  }

  destroy() {
    if (this._resizeTimeoutId) {
      clearTimeout(this._resizeTimeoutId);
      this._resizeTimeoutId = null;
    }

    this._peaks.off('player.play', this._onPlay);
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
  }
}
