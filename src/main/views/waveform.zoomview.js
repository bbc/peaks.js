/**
 * @file
 *
 * Defines the {@link WaveformZoomView} class.
 *
 * @module peaks/views/waveform.zoomview
 */

define([
  'peaks/waveform/waveform.axis',
  'peaks/waveform/waveform.utils',
  'peaks/views/playhead-layer',
  'peaks/views/points-layer',
  'peaks/views/segments-layer',
  'peaks/views/waveform-shape',
  'peaks/views/helpers/mousedraghandler',
  'peaks/views/zooms/animated',
  'peaks/views/zooms/static',
  'konva'
  ], function(
    WaveformAxis,
    Utils,
    PlayheadLayer,
    PointsLayer,
    SegmentsLayer,
    WaveformShape,
    MouseDragHandler,
    AnimatedZoomAdapter,
    StaticZoomAdapter,
    Konva) {
  'use strict';

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
    var self = this;

    self._originalWaveformData = waveformData;
    self._container = container;
    self._peaks = peaks;

    self._options = peaks.options;

    self._data = null;
    self._pixelLength = 0;

    var initialZoomLevel = self._options.zoomLevels[peaks.zoom.getZoom()];

    self._resampleData(initialZoomLevel);

    self._width = container.clientWidth;
    self._height = container.clientHeight || self._options.height;

    // The pixel offset of the current frame being displayed
    self._frameOffset = 0;

    self._stage = new Konva.Stage({
      container: container,
      width: self._width,
      height: self._height
    });

    self._waveformLayer = new Konva.FastLayer();

    self._axis = new WaveformAxis(self, self._waveformLayer, peaks.options);

    self._createWaveform();

    self._segmentsLayer = new SegmentsLayer(peaks, self, true);
    self._segmentsLayer.addToStage(self._stage);

    self._pointsLayer = new PointsLayer(peaks, self, true, true);
    self._pointsLayer.addToStage(self._stage);

    self._playheadLayer = new PlayheadLayer(
      peaks,
      self,
      self._options.showPlayheadTime,
      self._options.mediaElement.currentTime
    );

    self._playheadLayer.addToStage(self._stage);

    var time = self._peaks.player.getCurrentTime();

    self._syncPlayhead(time);

    self._mouseDragHandler = new MouseDragHandler(self._stage, {
      onMouseDown: function(mousePosX) {
        this.initialFrameOffset = self._frameOffset;
        this.mouseDownX = mousePosX;
      },

      onMouseMove: function(mousePosX) {
        // Moving the mouse to the left increases the time position of the
        // left-hand edge of the visible waveform.
        var diff = this.mouseDownX - mousePosX;

        var newFrameOffset = Utils.clamp(
          this.initialFrameOffset + diff, 0, self._pixelLength - self._width
        );

        if (newFrameOffset !== this.initialFrameOffset) {
          self._peaks.emit('user_scroll.zoomview', newFrameOffset);
        }
      },

      onMouseUp: function(mousePosX) {
        // Set playhead position only on click release, when not dragging.
        if (!self._mouseDragHandler.isDragging()) {
          var mouseDownX = Math.floor(this.mouseDownX);

          var pixelIndex = self._frameOffset + mouseDownX;

          var time = self.pixelsToTime(pixelIndex);

          self._updateWaveform(pixelIndex - mouseDownX);
          self._playheadLayer.updatePlayheadTime(time);

          self._peaks.player.seek(time);
        }
      }
    });

    // Events

    self._peaks.on('player_time_update', function(time) {
      if (self._mouseDragHandler.isDragging()) {
        return;
      }

      self._syncPlayhead(time);
    });

    self._peaks.on('user_seek', function(time) {
      var frameIndex = self.timeToPixels(time);

      self._updateWaveform(frameIndex - Math.floor(self._width / 2));
      self._playheadLayer.updatePlayheadTime(time);
    });

    self._peaks.on('user_scroll.zoomview', function(pixelOffset) {
      self._updateWaveform(pixelOffset);
    });

    self._peaks.on('player_play', function(time) {
      self._playheadLayer.updatePlayheadTime(time);
    });

    self._peaks.on('player_pause', function(time) {
      self._playheadLayer.stop(time);
    });

    self._peaks.on('zoom.update', function(currentScale, previousScale) {
      self.setZoomLevel(currentScale, previousScale);
    });

    self._peaks.on('window_resize', function() {
      self._width = self._container.clientWidth;
      self._stage.setWidth(self._width);
      self._updateWaveform(self._frameOffset);
    });

    function nudgeFrame(direction, large) {
      var increment;

      if (large) {
        increment = direction * self._width;
      }
      else {
        increment = direction * self.timeToPixels(self._options.nudgeIncrement);
      }

      self._updateWaveform(self._frameOffset + increment);
    }

    self._peaks.on('keyboard.left', nudgeFrame.bind(self, -1, false));
    self._peaks.on('keyboard.right', nudgeFrame.bind(self, 1, false));
    self._peaks.on('keyboard.shift_left', nudgeFrame.bind(self, -1, true));
    self._peaks.on('keyboard.shift_right', nudgeFrame.bind(self, 1, true));
  }

  WaveformZoomView.prototype.setWaveformData = function(waveformData) {
    this._originalWaveformData = waveformData;
    // Don't update the UI here, call setZoom().
  };

  WaveformZoomView.prototype._syncPlayhead = function(time) {
    this._playheadLayer.updatePlayheadTime(time);

    var pixelIndex = this.timeToPixels(time);

    // Check for the playhead reaching the right-hand side of the window.

    // TODO: move this code to animation function?
    // TODO: don't scroll if user has positioned view manually (e.g., using
    // the keyboard)
    var endThreshold = this._frameOffset + this._width - 100;

    if (pixelIndex >= endThreshold || pixelIndex < this._frameOffset) {
      // Put the playhead at 100 pixels from the left edge
      this._frameOffset = pixelIndex - 100;

      if (this._frameOffset < 0) {
        this._frameOffset = 0;
      }

      this._updateWaveform(this._frameOffset);
    }
  };

  /**
   * Changes the zoom level.
   *
   * @param {Number} currentScale The new zoom level, in samples per pixel.
   * @param {Number} previousScale The previous zoom level, in samples per
   *   pixel.
   */

  WaveformZoomView.prototype.setZoomLevel = function(currentScale, previousScale) {
    var currentTime = this._peaks.player.getCurrentTime();
    var apexTime;
    var playheadOffsetPixels = this._playheadLayer.getPlayheadOffset();

    if (playheadOffsetPixels >= 0 && playheadOffsetPixels < this._width) {
      // Playhead is visible. Change the zoom level while keeping the
      // playhead at the same position in the window.
      apexTime = currentTime;
    }
    else {
      // Playhead is not visible. Change the zoom level while keeping the
      // centre of the window at the same position in the waveform.
      playheadOffsetPixels = this._width / 2;
      apexTime = this.pixelsToTime(this._frameOffset + playheadOffsetPixels);
    }

    this._resampleData(currentScale);

    var apexPixel = this.timeToPixels(apexTime);

    this._frameOffset = apexPixel - playheadOffsetPixels;

    this._updateWaveform(this._frameOffset);

    this._playheadLayer.zoomLevelChanged();

    // Update the playhead position after zooming.
    this._playheadLayer.updatePlayheadTime(currentTime);

    // var adapter = this.createZoomAdapter(currentScale, previousScale);

    // adapter.start(relativePosition);
  };

  WaveformZoomView.prototype._resampleData = function(scale) {
    this._scale = scale;
    this._data = this._originalWaveformData.resample({ scale: scale });

    this._pixelLength = this._data.adapter.length;
  };

  /**
   * Returns the pixel index for a given time, for the current zoom level.
   *
   * @param {Number} time Time, in seconds.
   * @returns {Number} Pixel index.
   */

  WaveformZoomView.prototype.timeToPixels = function(time) {
    return Math.floor(time * this._data.adapter.sample_rate / this._data.adapter.scale);
  };

  /**
   * Returns the time for a given pixel index, for the current zoom level.
   *
   * @param {Number} pixels Pixel index.
   * @returns {Number} Time, in seconds.
   */

  WaveformZoomView.prototype.pixelsToTime = function(pixels) {
    return pixels * this._data.adapter.scale / this._data.adapter.sample_rate;
  };

  /* var zoomAdapterMap = {
    'animated': AnimatedZoomAdapter,
    'static': StaticZoomAdapter
  };

  WaveformZoomView.prototype.createZoomAdapter = function(currentScale, previousScale) {
    var ZoomAdapter = zoomAdapterMap[this._peaks.options.zoomAdapter];

    if (!ZoomAdapter) {
      throw new Error('Invalid zoomAdapter: ' + this._peaks.options.zoomAdapter);
    }

    return ZoomAdapter.create(currentScale, previousScale, this);
  }; */

  /**
   * @returns {Number} The start position of the waveform shown in the view,
   *   in pixels.
   */

  WaveformZoomView.prototype.getFrameOffset = function() {
    return this._frameOffset;
  };

  /**
   * @returns {Number} The width of the view, in pixels.
   */

  WaveformZoomView.prototype.getWidth = function() {
    return this._width;
  };

  /**
   * @returns {Number} The height of the view, in pixels.
   */

  WaveformZoomView.prototype.getHeight = function() {
    return this._height;
  };

  /**
   * Adjusts the amplitude scale of waveform shown in the view, which allows
   * users to zoom the waveform vertically.
   *
   * @param {Number} scale The new amplitude scale factor
   */

  WaveformZoomView.prototype.setAmplitudeScale = function(scale) {
    if (!Utils.isNumber(scale) || !Number.isFinite(scale)) {
       throw new Error('view.setAmplitudeScale(): Scale must be a valid number');
    }

    this._waveformShape.setAmplitudeScale(scale);
    this._waveformLayer.draw();

    this._segmentsLayer.setAmplitudeScale(scale);
  };

  /**
   * @returns {WaveformData} The view's waveform data.
   */

  WaveformZoomView.prototype.getWaveformData = function() {
    return this._data;
  };

  WaveformZoomView.prototype._createWaveform = function() {
    this._waveformShape = new WaveformShape({
      color: this._options.zoomWaveformColor,
      view: this
    });

    this._waveformLayer.add(this._waveformShape);
    this._stage.add(this._waveformLayer);

    this._peaks.emit('zoomview.displaying', 0, this.pixelsToTime(this._width));
  };

  /**
   * Updates the region of waveform shown in the view.
   *
   * @param {Number} frameOffset The new frame offset, in pixels.
   */

  WaveformZoomView.prototype._updateWaveform = function(frameOffset) {
    var upperLimit;

    if (this._pixelLength < this._width) {
      // Total waveform is shorter than viewport, so reset the offset to 0.
      frameOffset = 0;
      upperLimit = this._width;
    }
    else {
      // Calculate the very last possible position.
      upperLimit = this._pixelLength - this._width;
    }

    frameOffset = Utils.clamp(frameOffset, 0, upperLimit);

    this._frameOffset = frameOffset;

    // Display playhead if it is within the zoom frame width.
    var playheadPixel = this._playheadLayer.getPlayheadPixel();

    this._playheadLayer.updatePlayheadTime(this.pixelsToTime(playheadPixel));

    this._waveformLayer.draw();

    var frameStartTime = this.pixelsToTime(this._frameOffset);
    var frameEndTime   = this.pixelsToTime(this._frameOffset + this._width);

    this._pointsLayer.updatePoints(frameStartTime, frameEndTime);
    this._segmentsLayer.updateSegments(frameStartTime, frameEndTime);

    this._peaks.emit('zoomview.displaying', frameStartTime, frameEndTime);
  };

  WaveformZoomView.prototype.setWaveformColor = function(color) {
    this._waveformShape.setWaveformColor(color);
    this._waveformLayer.draw();
  };

  WaveformZoomView.prototype.showPlayheadTime = function(show) {
    this._playheadLayer.showPlayheadTime(show);
  };

  /* WaveformZoomView.prototype.beginZoom = function() {
    // Fade out the time axis and the segments
    // this._axis.axisShape.setAttr('opacity', 0);

    if (this._pointsLayer) {
      this._pointsLayer.setVisible(false);
    }

    if (this._segmentsLayer) {
      this._segmentsLayer.setVisible(false);
    }
  };

  WaveformZoomView.prototype.endZoom = function() {
    if (this._pointsLayer) {
      this._pointsLayer.setVisible(true);
    }

    if (this._segmentsLayer) {
      this._segmentsLayer.setVisible(true);
    }

    var time = this._peaks.player.getCurrentTime();

    this.seekFrame(this.timeToPixels(time));
  }; */

  WaveformZoomView.prototype.destroy = function() {
    if (this._stage) {
      this._stage.destroy();
      this._stage = null;
    }
  };

  return WaveformZoomView;
});
