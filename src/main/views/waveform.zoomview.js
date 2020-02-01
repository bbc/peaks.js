/**
 * @file
 *
 * Defines the {@link WaveformZoomView} class.
 *
 * @module peaks/views/waveform.zoomview
 */

define([
  'peaks/views/mouse-drag-handler',
  'peaks/views/playhead-layer',
  'peaks/views/points-layer',
  'peaks/views/segments-layer',
  'peaks/views/waveform-shape',
  // 'peaks/views/zooms/animated',
  // 'peaks/views/zooms/static',
  'peaks/waveform/waveform.axis',
  'peaks/waveform/waveform.utils',
  'konva'
  ], function(
    MouseDragHandler,
    PlayheadLayer,
    PointsLayer,
    SegmentsLayer,
    WaveformShape,
    // AnimatedZoomAdapter,
    // StaticZoomAdapter,
    WaveformAxis,
    Utils,
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

    // Bind event handlers
    self._onTimeUpdate = self._onTimeUpdate.bind(self);
    self._onSeek = self._onSeek.bind(self);
    self._onPlay = self._onPlay.bind(self);
    self._onPause = self._onPause.bind(self);
    self._onWindowResize = self._onWindowResize.bind(self);
    self._onZoomUpdate = self._onZoomUpdate.bind(self);
    self._onKeyboardLeft = self._onKeyboardLeft.bind(self);
    self._onKeyboardRight = self._onKeyboardRight.bind(self);
    self._onKeyboardShiftLeft  = self._onKeyboardShiftLeft.bind(self);
    self._onKeyboardShiftRight = self._onKeyboardShiftRight.bind(self);

    // Register event handlers
    self._peaks.on('player_time_update', self._onTimeUpdate);
    self._peaks.on('user_seek', self._onSeek);
    self._peaks.on('player_play', self._onPlay);
    self._peaks.on('player_pause', self._onPause);
    self._peaks.on('zoom.update', self._onZoomUpdate);
    self._peaks.on('window_resize', self._onWindowResize);
    self._peaks.on('keyboard.left', self._onKeyboardLeft);
    self._peaks.on('keyboard.right', self._onKeyboardRight);
    self._peaks.on('keyboard.shift_left', self._onKeyboardShiftLeft);
    self._peaks.on('keyboard.shift_right', self._onKeyboardShiftRight);

    self._enableAutoScroll = true;
    self._amplitudeScale = 1.0;

    self._options = peaks.options;

    self._data = null;
    self._pixelLength = 0;

    var initialZoomLevel = self._options.zoomLevels[peaks.zoom.getZoom()];

    self._fixedZoom = true;
    self._resizeTimeoutId = null;
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

    self._createWaveform();

    self._segmentsLayer = new SegmentsLayer(peaks, self, true);
    self._segmentsLayer.addToStage(self._stage);

    self._pointsLayer = new PointsLayer(peaks, self, true);
    self._pointsLayer.addToStage(self._stage);

    self._createAxisLabels();

    self._playheadLayer = new PlayheadLayer(
      peaks,
      self,
      self._options.showPlayheadTime
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
          self._updateWaveform(newFrameOffset);
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

    this._stage.on('dblclick', function(event) {
      var mousePosX = event.evt.layerX;

      var pixelIndex = self._frameOffset + mousePosX;

      var time = self.pixelsToTime(pixelIndex);

      self._peaks.emit('zoomview.dblclick', time);
    });
  }

  WaveformZoomView.prototype.getName = function() {
    return 'zoomview';
  };

  WaveformZoomView.prototype._onTimeUpdate = function(time) {
    if (this._mouseDragHandler.isDragging()) {
      return;
    }

    this._syncPlayhead(time);
  };

  WaveformZoomView.prototype._onSeek = function(time) {
    var frameIndex = this.timeToPixels(time);

    this._updateWaveform(frameIndex - Math.floor(this._width / 2));
    this._playheadLayer.updatePlayheadTime(time);
  };

  WaveformZoomView.prototype._onPlay = function(time) {
    this._playheadLayer.updatePlayheadTime(time);
  };

  WaveformZoomView.prototype._onPause = function(time) {
    this._playheadLayer.stop(time);
  };

  WaveformZoomView.prototype._onZoomUpdate = function(currentScale, previousScale) {
    this.setZoomLevel({ scale: currentScale });
  };

  WaveformZoomView.prototype._onWindowResize = function() {
    var self = this;

    var width = self._container.clientWidth;

    if (self._fixedZoom) {
      self._width = width;
      self._stage.width(width);
      self._updateWaveform(self._frameOffset);
    }
    else {
      if (self._resizeTimeoutId) {
        clearTimeout(self._resizeTimeoutId);
        self._resizeTimeoutId = null;
      }

      // Avoid resampling waveform data to zero width
      if (width !== 0) {
        self._width = width;
        self._stage.width(width);

        self._resizeTimeoutId = setTimeout(function() {
          self._width = width;
          self._data = self._originalWaveformData.resample(width);
          self._stage.width(width);

          self._updateWaveform(self._frameOffset);
        }, 500);
      }
    }
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
    var increment;

    if (large) {
      increment = direction * this._width;
    }
    else {
      increment = direction * this.timeToPixels(this._options.nudgeIncrement);
    }

    this._updateWaveform(this._frameOffset + increment);
  };

  WaveformZoomView.prototype.setWaveformData = function(waveformData) {
    this._originalWaveformData = waveformData;
    // Don't update the UI here, call setZoomLevel().
  };

  WaveformZoomView.prototype._syncPlayhead = function(time) {
    this._playheadLayer.updatePlayheadTime(time);

    if (this._enableAutoScroll) {
      // Check for the playhead reaching the right-hand side of the window.

      var pixelIndex = this.timeToPixels(time);

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
    }
  };

  /**
   * Changes the zoom level.
   *
   * @param {Number} scale The new zoom level, in samples per pixel.
   */

  WaveformZoomView.prototype._getScale = function(duration) {
    return duration * this._data.sample_rate / this._width;
  };

  function isAutoScale(options) {
    return ((Utils.objectHasProperty(options, 'scale') && options.scale === 'auto') ||
            (Utils.objectHasProperty(options, 'seconds') && options.seconds === 'auto'));
  }

  WaveformZoomView.prototype.setZoomLevel = function(options) {
    var scale;

    if (isAutoScale(options)) {
      var seconds = this._peaks.player.getDuration();

      if (!Utils.isValidTime(seconds)) {
        return false;
      }

      this._fixedZoom = false;
      scale = this._getScale(seconds);
    }
    else {
      if (Utils.objectHasProperty(options, 'scale')) {
        scale = options.scale;
      }
      else if (Utils.objectHasProperty(options, 'seconds')) {
        if (!Utils.isValidTime(options.seconds)) {
            return false;
        }

        scale = this._getScale(options.seconds);
      }

      this._fixedZoom = true;
    }

    if (scale < this._originalWaveformData.scale) {
      this._peaks.logger('peaks.zoomview.setZoomLevel(): zoom level must be at least ' + this._originalWaveformData.scale);
      scale = this._originalWaveformData.scale;
    }

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

    this._resampleData(scale);

    var apexPixel = this.timeToPixels(apexTime);

    this._frameOffset = apexPixel - playheadOffsetPixels;

    this._updateWaveform(this._frameOffset);

    this._playheadLayer.zoomLevelChanged();

    // Update the playhead position after zooming.
    this._playheadLayer.updatePlayheadTime(currentTime);

    // var adapter = this.createZoomAdapter(currentScale, previousScale);

    // adapter.start(relativePosition);

    return true;
  };

  WaveformZoomView.prototype._resampleData = function(scale) {
    this._scale = scale;
    this._data = this._originalWaveformData.resample({ scale: scale });

    this._pixelLength = this._data.length;
  };

  WaveformZoomView.prototype.getStartTime = function() {
    return this.pixelsToTime(this._frameOffset);
  };

  WaveformZoomView.prototype.getEndTime = function() {
    return this.pixelsToTime(this._frameOffset + this._width);
  };

  WaveformZoomView.prototype.setStartTime = function(time) {
    if (time < 0) {
      time = 0;
    }

    var frameOffset = Math.floor(time * this._data.sample_rate / this._scale);

    this._updateWaveform(frameOffset);
  };

  /**
   * Returns the pixel index for a given time, for the current zoom level.
   *
   * @param {Number} time Time, in seconds.
   * @returns {Number} Pixel index.
   */

  WaveformZoomView.prototype.timeToPixels = function(time) {
    return Math.floor(time * this._data.sample_rate / this._data.scale);
  };

  /**
   * Returns the time for a given pixel index, for the current zoom level.
   *
   * @param {Number} pixels Pixel index.
   * @returns {Number} Time, in seconds.
   */

  WaveformZoomView.prototype.pixelsToTime = function(pixels) {
    return pixels * this._data.scale / this._data.sample_rate;
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

    this._amplitudeScale = scale;

    this._waveformLayer.draw();
    this._segmentsLayer.draw();
  };

  WaveformZoomView.prototype.getAmplitudeScale = function() {
    return this._amplitudeScale;
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

  WaveformZoomView.prototype._createAxisLabels = function() {
    this._axisLayer = new Konva.FastLayer();

    this._axis = new WaveformAxis(this, {
      axisGridlineColor: this._options.axisGridlineColor,
      axisLabelColor:    this._options.axisLabelColor
    });

    this._axis.addToLayer(this._axisLayer);
    this._stage.add(this._axisLayer);
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
    this._axisLayer.draw();

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

  WaveformZoomView.prototype.enableAutoScroll = function(enable) {
    this._enableAutoScroll = enable;
  };

  WaveformZoomView.prototype.enableMarkerEditing = function(enable) {
    this._segmentsLayer.enableEditing(enable);
    this._pointsLayer.enableEditing(enable);
  };

  WaveformZoomView.prototype.fitToContainer = function() {
    if (this._container.clientWidth === 0 && this._container.clientHeight === 0) {
      return;
    }

    var updateWaveform = false;

    if (this._container.clientWidth !== this._width) {
      this._width = this._container.clientWidth;
      this._stage.width(this._width);

      if (!this._fixedZoom) {
        try {
          this._data = this._originalWaveformData.resample({ width: this._width });
          updateWaveform = true;
        }
        catch (error) {
          // Ignore, and leave this._data as it was
        }
      }
    }

    this._height = this._container.clientHeight;
    this._stage.height(this._height);

    this._playheadLayer.fitToView();
    this._segmentsLayer.fitToView();
    this._pointsLayer.fitToView();

    if (updateWaveform) {
      this._updateWaveform(this._frameOffset);
    }

    this._stage.draw();
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
    if (this._resizeTimeoutId) {
      clearTimeout(this._resizeTimeoutId);
      this._resizeTimeoutId = null;
    }

    // Unregister event handlers
    this._peaks.off('player_time_update', this._onTimeUpdate);
    this._peaks.off('user_seek', this._onSeek);
    this._peaks.off('player_play', this._onPlay);
    this._peaks.off('player_pause', this._onPause);
    this._peaks.off('zoom.update', this._onZoomUpdate);
    this._peaks.off('window_resize', this._onWindowResize);
    this._peaks.off('keyboard.left', this._onKeyboardLeft);
    this._peaks.off('keyboard.right', this._onKeyboardRight);
    this._peaks.off('keyboard.shift_left', this._onKeyboardShiftLeft);
    this._peaks.off('keyboard.shift_right', this._onKeyboardShiftRight);

    this._segmentsLayer.destroy();
    this._pointsLayer.destroy();

    if (this._stage) {
      this._stage.destroy();
      this._stage = null;
    }
  };

  return WaveformZoomView;
});
