/**
 * @file
 *
 * Defines the {@link WaveformView} class.
 *
 * @module waveform-view
 */

import PointsLayer from './points-layer';
import PlayheadLayer from './playhead-layer';
import SegmentsLayer from './segments-layer';
import WaveformAxis from './waveform-axis';
import WaveformShape from './waveform-shape';

import { formatTime, getMarkerObject, isFinite, isNumber } from './utils';

import Konva from 'konva/lib/Core';

function WaveformView(waveformData, container, peaks, viewOptions) {
  const self = this;

  self._container = container;
  self._peaks = peaks;
  self._options = peaks.options;
  self._viewOptions = viewOptions;

  self._originalWaveformData = waveformData;
  self._data = waveformData;

  // The pixel offset of the current frame being displayed
  self._frameOffset = 0;
  self._width = container.clientWidth;
  self._height = container.clientHeight;

  self._amplitudeScale = 1.0;

  self._waveformColor = self._viewOptions.waveformColor;
  self._playedWaveformColor = self._viewOptions.playedWaveformColor;

  self._timeLabelPrecision = self._viewOptions.timeLabelPrecision;

  if (self._viewOptions.formatPlayheadTime) {
    self._formatPlayheadTime = self._viewOptions.formatPlayheadTime;
  }
  else {
    self._formatPlayheadTime = function(time) {
      return formatTime(time, self._timeLabelPrecision);
    };
  }

  self._enableSeek = true;

  self.initWaveform();

  // Disable warning: The stage has 6 layers.
  // Recommended maximum number of layers is 3-5.
  Konva.showWarnings = false;

  self._stage = new Konva.Stage({
    container: container,
    width: self._width,
    height: self._height
  });

  self._createWaveform();

  if (self._viewOptions.enableSegments) {
    self._segmentsLayer = new SegmentsLayer(peaks, self, self._viewOptions.enableEditing);
    self._segmentsLayer.addToStage(self._stage);
  }

  if (self._viewOptions.enablePoints) {
    self._pointsLayer = new PointsLayer(peaks, self, self._viewOptions.enableEditing);
    self._pointsLayer.addToStage(self._stage);
  }

  self.initHighlightLayer();

  self._createAxisLabels();

  self._playheadLayer = new PlayheadLayer({
    player: self._peaks.player,
    view: self,
    showPlayheadTime: self._viewOptions.showPlayheadTime,
    playheadColor: self._viewOptions.playheadColor,
    playheadTextColor: self._viewOptions.playheadTextColor,
    playheadBackgroundColor: self._viewOptions.playheadBackgroundColor,
    playheadPadding: self._viewOptions.playheadPadding,
    playheadFontFamily: self._viewOptions.fontFamily,
    playheadFontSize: self._viewOptions.fontSize,
    playheadFontStyle: self._viewOptions.fontStyle
  });

  self._playheadLayer.addToStage(self._stage);

  self._onClick = self._onClick.bind(self);
  self._onDblClick = self._onDblClick.bind(self);
  self._onContextMenu = self._onContextMenu.bind(self);

  self._stage.on('click', self._onClick);
  self._stage.on('dblclick', self._onDblClick);
  self._stage.on('contextmenu', self._onContextMenu);
}

WaveformView.prototype.getViewOptions = function() {
  return this._viewOptions;
};

/**
 * @returns {WaveformData} The view's waveform data.
 */

WaveformView.prototype.getWaveformData = function() {
  return this._data;
};

WaveformView.prototype.setWaveformData = function(waveformData) {
  this._data = waveformData;
};

/**
 * Returns the pixel index for a given time, for the current zoom level.
 *
 * @param {Number} time Time, in seconds.
 * @returns {Number} Pixel index.
 */

WaveformView.prototype.timeToPixels = function(time) {
  return Math.floor(time * this._data.sample_rate / this._data.scale);
};

/**
 * Returns the time for a given pixel index, for the current zoom level.
 *
 * @param {Number} pixels Pixel index.
 * @returns {Number} Time, in seconds.
 */

WaveformView.prototype.pixelsToTime = function(pixels) {
  return pixels * this._data.scale / this._data.sample_rate;
};

/**
 * Returns the time for a given pixel offset (relative to the
 * current scroll position), for the current zoom level.
 *
 * @param {Number} offset Offset from left-visible-edge of view
 * @returns {Number} Time, in seconds.
 */

WaveformView.prototype.pixelOffsetToTime = function(offset) {
  const pixels = this._frameOffset + offset;

  return pixels * this._data.scale / this._data.sample_rate;
};

WaveformView.prototype.timeToPixelOffset = function(time) {
  return Math.floor(time * this._data.sample_rate / this._data.scale) - this._frameOffset;
};

/**
 * @returns {Number} The start position of the waveform shown in the view,
 *   in pixels.
 */

WaveformView.prototype.getFrameOffset = function() {
  return this._frameOffset;
};

/**
 * @returns {Number} The width of the view, in pixels.
 */

WaveformView.prototype.getWidth = function() {
  return this._width;
};

/**
 * @returns {Number} The height of the view, in pixels.
 */

WaveformView.prototype.getHeight = function() {
  return this._height;
};

/**
 * @returns {Number} The time at the left edge of the waveform view.
 */

WaveformView.prototype.getStartTime = function() {
  return this.pixelOffsetToTime(0);
};

/**
 * @returns {Number} The time at the right edge of the waveform view.
 */

WaveformView.prototype.getEndTime = function() {
  return this.pixelOffsetToTime(this._width);
};

/**
 * @returns {Number} The media duration, in seconds.
 */

WaveformView.prototype._getDuration = function() {
  return this._peaks.player.getDuration();
};

WaveformView.prototype._createWaveform = function() {
  this._waveformLayer = new Konva.Layer({ listening: false });

  this._createWaveformShapes();

  this._stage.add(this._waveformLayer);
};

WaveformView.prototype._createWaveformShapes = function() {
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

WaveformView.prototype.setWaveformColor = function(color) {
  this._waveformColor = color;
  this._waveformShape.setWaveformColor(color);
};

WaveformView.prototype.setPlayedWaveformColor = function(color) {
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

WaveformView.prototype._destroyPlayedWaveformShape = function() {
  this._waveformShape.setSegment(null);

  this._playedWaveformShape.destroy();
  this._playedWaveformShape = null;

  this._playedSegment = null;
  this._unplayedSegment = null;
};

WaveformView.prototype._createAxisLabels = function() {
  this._axisLayer = new Konva.Layer({ listening: false });
  this._axis = new WaveformAxis(this, this._viewOptions);

  this._axis.addToLayer(this._axisLayer);
  this._stage.add(this._axisLayer);
};

WaveformView.prototype.showAxisLabels = function(show, options) {
  this._axis.showAxisLabels(show, options);
  this._axisLayer.draw();
};

WaveformView.prototype.showPlayheadTime = function(show) {
  this._playheadLayer.showPlayheadTime(show);
};

WaveformView.prototype.setTimeLabelPrecision = function(precision) {
  this._timeLabelPrecision = precision;
  this._playheadLayer.updatePlayheadText();
};

WaveformView.prototype.formatTime = function(time) {
  return this._formatPlayheadTime(time);
};

/**
 * Adjusts the amplitude scale of waveform shown in the view, which allows
 * users to zoom the waveform vertically.
 *
 * @param {Number} scale The new amplitude scale factor
 */

WaveformView.prototype.setAmplitudeScale = function(scale) {
  if (!isNumber(scale) || !isFinite(scale)) {
    throw new Error('view.setAmplitudeScale(): Scale must be a valid number');
  }

  this._amplitudeScale = scale;

  this.drawWaveformLayer();

  if (this._segmentsLayer) {
    this._segmentsLayer.draw();
  }
};

WaveformView.prototype.getAmplitudeScale = function() {
  return this._amplitudeScale;
};

WaveformView.prototype.enableSeek = function(enable) {
  this._enableSeek = enable;
};

WaveformView.prototype.isSeekEnabled = function() {
  return this._enableSeek;
};

WaveformView.prototype._onClick = function(event) {
  this._clickHandler(event, 'click');
};

WaveformView.prototype._onDblClick = function(event) {
  this._clickHandler(event, 'dblclick');
};

WaveformView.prototype._onContextMenu = function(event) {
  this._clickHandler(event, 'contextmenu');
};

WaveformView.prototype._clickHandler = function(event, eventName) {
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
    const mousePosX = event.evt.layerX;
    const time = this.pixelOffsetToTime(mousePosX);
    const viewName = this.getName();

    this._peaks.emit(viewName + '.' + eventName, {
      time: time,
      evt: event.evt
    });
  }
};

WaveformView.prototype.updatePlayheadTime = function(time) {
  this._playheadLayer.updatePlayheadTime(time);
};

WaveformView.prototype.playheadPosChanged = function(time) {
  if (this._playedWaveformShape) {
    this._playedSegment.endTime = time;
    this._unplayedSegment.startTime = time;

    this.drawWaveformLayer();
  }
};

WaveformView.prototype.drawWaveformLayer = function() {
  this._waveformLayer.draw();
};

WaveformView.prototype.enableMarkerEditing = function(enable) {
  if (this._segmentsLayer) {
    this._segmentsLayer.enableEditing(enable);
  }

  if (this._pointsLayer) {
    this._pointsLayer.enableEditing(enable);
  }
};

WaveformView.prototype.fitToContainer = function() {
  if (this._container.clientWidth === 0 && this._container.clientHeight === 0) {
    return;
  }

  let updateWaveform = false;

  if (this._container.clientWidth !== this._width) {
    this._width = this._container.clientWidth;
    this._stage.setWidth(this._width);

    updateWaveform = this.containerWidthChange();
  }

  if (this._container.clientHeight !== this._height) {
    this._height = this._container.clientHeight;
    this._stage.height(this._height);

    this._waveformShape.fitToView();
    this._playheadLayer.fitToView();

    if (this._segmentsLayer) {
      this._segmentsLayer.fitToView();
    }

    if (this._pointsLayer) {
      this._pointsLayer.fitToView();
    }

    this.containerHeightChange();
  }

  if (updateWaveform) {
    this.updateWaveform(this._frameOffset);
  }
};

WaveformView.prototype.destroy = function() {
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

export default WaveformView;
