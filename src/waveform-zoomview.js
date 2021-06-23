/**
 * @file
 *
 * Defines the {@link WaveformZoomView} class.
 *
 * @module waveform-zoomview
 */

define([
  './mouse-drag-handler',
  './playhead-layer',
  './points-layer',
  './segments-layer',
  './waveform-axis',
  './waveform-shape',
  // './animated-zoom-adapter',
  // './static-zoom-adapter',
  './utils',
  'konva'
], function(
    MouseDragHandler,
    PlayheadLayer,
    PointsLayer,
    SegmentsLayer,
    WaveformAxis,
    WaveformShape,
    // AnimatedZoomAdapter,
    // StaticZoomAdapter,
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
    self._options = peaks.options;
    self._viewOptions = peaks.options.zoomview;

    // Bind event handlers
    self._onTimeUpdate = self._onTimeUpdate.bind(self);
    self._onPlay = self._onPlay.bind(self);
    self._onPause = self._onPause.bind(self);
    self._onWindowResize = self._onWindowResize.bind(self);
    self._onKeyboardLeft = self._onKeyboardLeft.bind(self);
    self._onKeyboardRight = self._onKeyboardRight.bind(self);
    self._onKeyboardShiftLeft  = self._onKeyboardShiftLeft.bind(self);
    self._onKeyboardShiftRight = self._onKeyboardShiftRight.bind(self);

    // Register event handlers
    self._peaks.on('player.timeupdate', self._onTimeUpdate);
    self._peaks.on('player.play', self._onPlay);
    self._peaks.on('player.pause', self._onPause);
    self._peaks.on('window_resize', self._onWindowResize);
    self._peaks.on('keyboard.left', self._onKeyboardLeft);
    self._peaks.on('keyboard.right', self._onKeyboardRight);
    self._peaks.on('keyboard.shift_left', self._onKeyboardShiftLeft);
    self._peaks.on('keyboard.shift_right', self._onKeyboardShiftRight);

    self._enableAutoScroll = true;
    self._amplitudeScale = 1.0;
    self._timeLabelPrecision = self._viewOptions.timeLabelPrecision;

    self._data = null;
    self._pixelLength = 0;

    var initialZoomLevel = peaks.zoom.getZoomLevel();

    self._zoomLevelAuto = false;
    self._zoomLevelSeconds = null;

    self._resizeTimeoutId = null;
    self._resampleData({ scale: initialZoomLevel });

    self._width = container.clientWidth;
    self._height = container.clientHeight;

    // The pixel offset of the current frame being displayed
    self._frameOffset = 0;

    self._stage = new Konva.Stage({
      container: container,
      width: self._width,
      height: self._height
    });

    self._waveformLayer = new Konva.Layer({ listening: false });

    self._waveformColor = self._viewOptions.waveformColor;
    self._playedWaveformColor = self._viewOptions.playedWaveformColor;

    self._createWaveform();

    self._segmentsLayer = new SegmentsLayer(peaks, self, true);
    self._segmentsLayer.addToStage(self._stage);

    self._pointsLayer = new PointsLayer(peaks, self, true);
    self._pointsLayer.addToStage(self._stage);

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
        var newFrameOffset = this.initialFrameOffset + diff;

        self._updateWaveform(newFrameOffset);
      },

      onMouseUp: function(/* mousePosX */) {
        // Set playhead position only on click release, when not dragging.
        if (!self._mouseDragHandler.isDragging()) {
          var time = self.pixelOffsetToTime(this.mouseDownX);
          var duration = self._getDuration();

          // Prevent the playhead position from jumping by limiting click
          // handling to the waveform duration.
          if (time > duration) {
            time = duration;
          }

          self._playheadLayer.updatePlayheadTime(time);

          self._peaks.player.seek(time);
        }
      }
    });

    self._onWheel = self._onWheel.bind(self);
    self.setWheelMode(self._viewOptions.wheelMode);

    self._onClick = self._onClick.bind(this);
    self._onDblClick = self._onDblClick.bind(this);

    self._stage.on('click', self._onClick);
    self._stage.on('dblclick', self._onDblClick);
  }

  WaveformZoomView.prototype._onClick = function(event) {
    this._clickHandler(event, 'zoomview.click');
  };

  WaveformZoomView.prototype._onDblClick = function(event) {
    this._clickHandler(event, 'zoomview.dblclick');
  };

  WaveformZoomView.prototype._clickHandler = function(event, eventName) {
    var mousePosX = event.evt.layerX;
    var time = this.pixelOffsetToTime(mousePosX);

    this._peaks.emit(eventName, time);
  };

  WaveformZoomView.prototype.setWheelMode = function(mode) {
    if (mode !== this._wheelMode) {
      this._wheelMode = mode;

      switch (mode) {
        case 'scroll':
          this._stage.on('wheel', this._onWheel);
          break;

        case 'none':
          this._stage.off('wheel');
          break;
      }
    }
  };

  WaveformZoomView.prototype._onWheel = function(event) {
    var wheelEvent = event.evt;
    var delta = wheelEvent.shiftKey ? wheelEvent.deltaY : wheelEvent.deltaX;
    var offAxisDelta = wheelEvent.shiftKey ? wheelEvent.deltaX : wheelEvent.deltaY;

    // Ignore the event if it looks like the user is scrolling vertically
    // down the page
    if (Math.abs(delta) < Math.abs(offAxisDelta)) {
      return;
    }

    event.evt.preventDefault();

    var newFrameOffset = Utils.clamp(
      this._frameOffset + Math.floor(delta), 0, this._pixelLength - this._width
    );

    this._updateWaveform(newFrameOffset);
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

  WaveformZoomView.prototype._onPlay = function(time) {
    this._playheadLayer.updatePlayheadTime(time);
  };

  WaveformZoomView.prototype._onPause = function(time) {
    this._playheadLayer.stop(time);
  };

  WaveformZoomView.prototype._onWindowResize = function() {
    var self = this;

    var width = self._container.clientWidth;

    if (!self._zoomLevelAuto) {
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
    // Don't update the UI here, call setZoom().
  };

  WaveformZoomView.prototype.playheadPosChanged = function(time) {
    if (this._playedWaveformShape) {
      this._playedSegment.endTime = time;
      this._unplayedSegment.startTime = time;

      this._waveformLayer.draw();
    }
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

  WaveformZoomView.prototype.setZoom = function(options) {
    var scale;

    if (isAutoScale(options)) {
      var seconds = this._peaks.player.getDuration();

      if (!Utils.isValidTime(seconds)) {
        return false;
      }

      this._zoomLevelAuto = true;
      this._zoomLevelSeconds = null;
      scale = this._getScale(seconds);
    }
    else {
      if (Utils.objectHasProperty(options, 'scale')) {
        this._zoomLevelSeconds = null;
        scale = options.scale;
      }
      else if (Utils.objectHasProperty(options, 'seconds')) {
        if (!Utils.isValidTime(options.seconds)) {
          return false;
        }

        this._zoomLevelSeconds = options.seconds;
        scale = this._getScale(options.seconds);
      }

      this._zoomLevelAuto = false;
    }

    if (scale < this._originalWaveformData.scale) {
      // eslint-disable-next-line max-len
      this._peaks.logger('peaks.zoomview.setZoom(): zoom level must be at least ' + this._originalWaveformData.scale);
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
      playheadOffsetPixels = Math.floor(this._width / 2);
      apexTime = this.pixelOffsetToTime(playheadOffsetPixels);
    }

    var prevScale = this._scale;

    this._resampleData({ scale: scale });

    var apexPixel = this.timeToPixels(apexTime);

    this._frameOffset = apexPixel - playheadOffsetPixels;

    this._updateWaveform(this._frameOffset);

    this._playheadLayer.zoomLevelChanged();

    // Update the playhead position after zooming.
    this._playheadLayer.updatePlayheadTime(currentTime);

    // var adapter = this.createZoomAdapter(currentScale, previousScale);

    // adapter.start(relativePosition);

    this._peaks.emit('zoom.update', scale, prevScale);

    return true;
  };

  WaveformZoomView.prototype._resampleData = function(options) {
    this._data = this._originalWaveformData.resample(options);
    this._scale = this._data.scale;
    this._pixelLength = this._data.length;
  };

  WaveformZoomView.prototype.getStartTime = function() {
    return this.pixelOffsetToTime(0);
  };

  WaveformZoomView.prototype.getEndTime = function() {
    return this.pixelOffsetToTime(this._width);
  };

  WaveformZoomView.prototype.setStartTime = function(time) {
    if (time < 0) {
      time = 0;
    }

    if (this._zoomLevelAuto) {
      time = 0;
    }

    this._updateWaveform(this.timeToPixels(time));
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

  /**
   * Returns the time for a given pixel offset (relative to the
   * current scroll position), for the current zoom level.
   *
   * @param {Number} offset Offset from left-visible-edge of view
   * @returns {Number} Time, in seconds.
   */

  WaveformZoomView.prototype.pixelOffsetToTime = function(offset) {
    var pixels = this._frameOffset + offset;

    return pixels * this._data.scale / this._data.sample_rate;
  };

  /* var zoomAdapterMap = {
    'animated': AnimatedZoomAdapter,
    'static': StaticZoomAdapter
  };

  WaveformZoomView.prototype.createZoomAdapter = function(currentScale, previousScale) {
    var ZoomAdapter = zoomAdapterMap[this._viewOptions.zoomAdapter];

    if (!ZoomAdapter) {
      throw new Error('Invalid zoomAdapter: ' + this._viewOptions.zoomAdapter);
    }

    return ZoomAdapter.create(this, currentScale, previousScale);
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
   * @returns {Number} The media duration, in seconds.
   */

  WaveformZoomView.prototype._getDuration = function() {
    return this._peaks.player.getDuration();
  };

  /**
   * Adjusts the amplitude scale of waveform shown in the view, which allows
   * users to zoom the waveform vertically.
   *
   * @param {Number} scale The new amplitude scale factor
   */

  WaveformZoomView.prototype.setAmplitudeScale = function(scale) {
    if (!Utils.isNumber(scale) || !Utils.isFinite(scale)) {
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

  WaveformZoomView.prototype._createWaveformShapes = function() {
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
  };

  WaveformZoomView.prototype._destroyPlayedWaveformShape = function() {
    this._waveformShape.setSegment(null);

    this._playedWaveformShape.destroy();
    this._playedWaveformShape = null;

    this._playedSegment = null;
    this._unplayedSegment = null;
  };

  WaveformZoomView.prototype._createWaveform = function() {
    this._createWaveformShapes();

    this._stage.add(this._waveformLayer);

    this._peaks.emit('zoomview.displaying', 0, this.getEndTime());
  };

  WaveformZoomView.prototype._createAxisLabels = function() {
    this._axisLayer = new Konva.Layer({ listening: false });

    this._axis = new WaveformAxis(this, {
      axisGridlineColor:   this._viewOptions.axisGridlineColor,
      axisLabelColor:      this._viewOptions.axisLabelColor,
      axisLabelFontFamily: this._viewOptions.fontFamily,
      axisLabelFontSize:   this._viewOptions.fontSize,
      axisLabelFontStyle:  this._viewOptions.fontStyle
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

    var frameStartTime = this.getStartTime();
    var frameEndTime   = this.getEndTime();

    this._pointsLayer.updatePoints(frameStartTime, frameEndTime);
    this._segmentsLayer.updateSegments(frameStartTime, frameEndTime);

    this._peaks.emit('zoomview.displaying', frameStartTime, frameEndTime);
  };

  WaveformZoomView.prototype.setWaveformColor = function(color) {
    this._waveformColor = color;
    this._waveformShape.setWaveformColor(color);
    this._waveformLayer.draw();
  };

  WaveformZoomView.prototype.setPlayedWaveformColor = function(color) {
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
  };

  WaveformZoomView.prototype.showPlayheadTime = function(show) {
    this._playheadLayer.showPlayheadTime(show);
  };

  WaveformZoomView.prototype.setTimeLabelPrecision = function(precision) {
    this._timeLabelPrecision = precision;
    this._playheadLayer.updatePlayheadText();
  };

  WaveformZoomView.prototype.formatTime = function(time) {
    return Utils.formatTime(time, this._timeLabelPrecision);
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

      var resample = false;
      var resampleOptions;

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
    }

    this._height = this._container.clientHeight;
    this._stage.height(this._height);

    this._waveformShape.fitToView();
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
    this._peaks.off('player.timeupdate', this._onTimeUpdate);
    this._peaks.off('player.play', this._onPlay);
    this._peaks.off('player.pause', this._onPause);
    this._peaks.off('window_resize', this._onWindowResize);
    this._peaks.off('keyboard.left', this._onKeyboardLeft);
    this._peaks.off('keyboard.right', this._onKeyboardRight);
    this._peaks.off('keyboard.shift_left', this._onKeyboardShiftLeft);
    this._peaks.off('keyboard.shift_right', this._onKeyboardShiftRight);

    this._playheadLayer.destroy();
    this._segmentsLayer.destroy();
    this._pointsLayer.destroy();

    if (this._stage) {
      this._stage.destroy();
      this._stage = null;
    }
  };

  return WaveformZoomView;
});
