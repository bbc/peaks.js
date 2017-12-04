/**
 * @file
 *
 * Defines the {@link WaveformZoomView} class.
 *
 * @module peaks/views/waveform.zoomview
 */

define([
  'peaks/waveform/waveform.axis',
  'peaks/waveform/waveform.mixins',
  'peaks/waveform/waveform.utils',
  'peaks/views/playhead-layer',
  'peaks/views/points-layer',
  'peaks/views/segments-layer',
  'peaks/views/helpers/mousedraghandler',
  'peaks/views/zooms/animated',
  'peaks/views/zooms/static',
  'konva'
  ], function(
    WaveformAxis,
    mixins,
    Utils,
    PlayheadLayer,
    PointsLayer,
    SegmentsLayer,
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

    self.originalWaveformData = waveformData;
    self.container = container;
    self.peaks = peaks;

    self.options = peaks.options;

    self.playheadVisible = false;

    self.data = null;
    self.pixelLength = 0;
    self.intermediateData = null;

    var initialZoomLevel = self.options.zoomLevels[peaks.zoom.getZoom()];

    self.resampleData(initialZoomLevel);

    self.width = container.clientWidth;
    self.height = container.clientHeight || self.options.height;

    // The pixel offset of the current frame being displayed
    self.frameOffset = 0;

    self.stage = new Konva.Stage({
      container: container,
      width: self.width,
      height: self.height
    });

    self.backgroundLayer = new Konva.Layer();

    self.background = new Konva.Rect({
      x: 0,
      y: 0,
      width: self.width,
      height: self.height
    });

    self.backgroundLayer.add(self.background);
    self.stage.add(self.backgroundLayer);

    self.waveformLayer = new Konva.FastLayer();

    self.axis = new WaveformAxis(self, self.waveformLayer);

    self.createWaveform();

    self._segmentsLayer = new SegmentsLayer(peaks, self.stage, self, true);
    self._pointsLayer = new PointsLayer(peaks, self.stage, self, true, true);

    self._playheadLayer = new PlayheadLayer(
        peaks,
        self.stage,
        self,
        self.options.showPlayheadTime,
        self.options.mediaElement.currentTime
    );

    self.mouseDragHandler = new MouseDragHandler(self.stage, {
      onMouseDown: function(mousePosX) {
        this.initialFrameOffset = self.frameOffset;
        this.mouseDownX = mousePosX;
      },

      onMouseMove: function(mousePosX) {
        // Moving the mouse to the left increases the time position of the
        // left-hand edge of the visible waveform.
        var diff = this.mouseDownX - mousePosX;

        var newFrameOffset = Utils.clamp(
          this.initialFrameOffset + diff, 0, self.pixelLength - self.width
        );

        if (newFrameOffset !== this.initialFrameOffset) {
          self.peaks.emit('user_scroll.zoomview', newFrameOffset);
        }
      },

      onMouseUp: function(mousePosX) {
        // Set playhead position only on click release, when not dragging.
        if (!self.mouseDragHandler.isDragging()) {
          var mouseDownX = Math.floor(this.mouseDownX);

          var pixelIndex = self.frameOffset + mouseDownX;

          var time = self.pixelsToTime(pixelIndex);

          self.updateWaveform(pixelIndex - mouseDownX);
          self._playheadLayer.updatePlayheadTime(time);

          self.peaks.player.seek(time);
        }
      }
    });

    // Events

    self.peaks.on('player_time_update', function(time) {
      if (self.mouseDragHandler.isDragging()) {
        return;
      }

      self._playheadLayer.updatePlayheadTime(time);

      var pixelIndex = self.timeToPixels(time);

      // Check for the playhead reaching the right-hand side of the window.

      // TODO: move this code to animation function?
      // TODO: don't scroll if user has positioned view manually (e.g., using
      // the keyboard)
      var endThreshold = self.frameOffset + self.width - 100;

      if (pixelIndex >= endThreshold || pixelIndex < self.frameOffset) {
        // Put the playhead at 100 pixels from the left edge
        self.frameOffset = pixelIndex - 100;

        if (self.frameOffset < 0) {
          self.frameOffset = 0;
        }

        self.updateWaveform(self.frameOffset);
      }
    });

    self.peaks.on('user_seek', function(time) {
      var frameIndex = self.timeToPixels(time);

      self.updateWaveform(frameIndex - Math.floor(self.width / 2));
      self._playheadLayer.updatePlayheadTime(time);
    });

    self.peaks.on('user_scroll.zoomview', function(pixelOffset) {
      self.updateWaveform(pixelOffset);
    });

    self.peaks.on('player_play', function(time) {
      self._playheadLayer.updatePlayheadTime(time);
    });

    self.peaks.on('player_pause', function(time) {
      self._playheadLayer.stop(time);
    });

    self.peaks.on('zoom.update', function(currentScale, previousScale) {
      self.setZoomLevel(currentScale, previousScale);
    });

    peaks.on('window_resize', function() {
      self.container.hidden = true;
    });

    self.peaks.on('window_resize_complete', function(width) {
      self.width = width;
      self.stage.setWidth(self.width);
      self.updateWaveform(self.frameOffset);
      self.container.removeAttribute('hidden');
    });

    function nudgeFrame(direction, large) {
      var increment;

      if (large) {
        increment = direction * self.width;
      }
      else {
        increment = direction * self.timeToPixels(self.options.nudgeIncrement);
      }

      self.updateWaveform(self.frameOffset + increment);
    }

    self.peaks.on('keyboard.left', nudgeFrame.bind(self, -1, false));
    self.peaks.on('keyboard.right', nudgeFrame.bind(self, 1, false));
    self.peaks.on('keyboard.shift_left', nudgeFrame.bind(self, -1, true));
    self.peaks.on('keyboard.shift_right', nudgeFrame.bind(self, 1, true));

    self.peaks.emit('waveform_ready.zoomview', this);
  }

  /**
   * Changes the zoom level.
   *
   * @param {Number} currentScale The new zoom level, in samples per pixel.
   * @param {Number} previousScale The previous zoom level, in samples per
   *   pixel.
   */

  WaveformZoomView.prototype.setZoomLevel = function(currentScale, previousScale) {
    if (currentScale === this._scale) {
      // Nothing to do.
      return;
    }

    var currentTime = this.peaks.player.getCurrentTime();
    var apexTime;
    var playheadOffsetPixels = this._playheadLayer.getPlayheadOffset();

    if (playheadOffsetPixels >= 0 && playheadOffsetPixels < this.width) {
      // Playhead is visible. Change the zoom level while keeping the
      // playhead at the same position in the window.
      apexTime = currentTime;
    }
    else {
      // Playhead is not visible. Change the zoom level while keeping the
      // centre of the window at the same position in the waveform.
      playheadOffsetPixels = this.width / 2;
      apexTime = this.pixelsToTime(this.frameOffset + playheadOffsetPixels);
    }

    this.resampleData(currentScale);

    var apexPixel = this.timeToPixels(apexTime);

    this.frameOffset = apexPixel - playheadOffsetPixels;

    this.updateWaveform(this.frameOffset);

    this._playheadLayer.zoomLevelChanged();

    // Update the playhead position after zooming.
    this._playheadLayer.updatePlayheadTime(currentTime);

    // var adapter = this.createZoomAdapter(currentScale, previousScale);

    // adapter.start(relativePosition);
  };

  WaveformZoomView.prototype.resampleData = function(scale) {
    this._scale = scale;
    this.data = this.originalWaveformData.resample({ scale: scale });

    this.pixelLength = this.data.adapter.length;
  };

  /**
   * Returns the pixel index for a given time, for the current zoom level.
   *
   * @param {Number} time Time, in seconds.
   * @returns {Number} Pixel index.
   */

  WaveformZoomView.prototype.timeToPixels = function(time) {
    return Math.floor(time * this.data.adapter.sample_rate / this.data.adapter.scale);
  };

  /**
   * Returns the time for a given pixel index, for the current zoom level.
   *
   * @param {Number} pixels Pixel index.
   * @returns {Number} Time, in seconds.
   */

  WaveformZoomView.prototype.pixelsToTime = function(pixels) {
    return pixels * this.data.adapter.scale / this.data.adapter.sample_rate;
  };

  var zoomAdapterMap = {
    'animated': AnimatedZoomAdapter,
    'static': StaticZoomAdapter
  };

  WaveformZoomView.prototype.createZoomAdapter = function(currentScale, previousScale) {
    var ZoomAdapter = zoomAdapterMap[this.peaks.options.zoomAdapter];

    if (!ZoomAdapter) {
      throw new Error('Invalid zoomAdapter: ' + this.peaks.options.zoomAdapter);
    }

    return ZoomAdapter.create(currentScale, previousScale, this);
  };

  WaveformZoomView.prototype.createWaveform = function() {
    var self = this;

    this.waveformShape = new Konva.Shape({
      fill: this.options.zoomWaveformColor,
      strokeWidth: 0,
      sceneFunc: function(context) {
        mixins.drawWaveform(
          context,
          self.data,
          self.frameOffset,
          self.frameOffset,
          self.frameOffset + self.width,
          self.width,
          self.height
        );

        context.fillStrokeShape(this);
      }
    });

    this.waveformLayer.add(this.waveformShape);
    this.stage.add(this.waveformLayer);

    this.peaks.emit('zoomview.displaying', 0, this.pixelsToTime(this.width));
  };

  /**
   * Updates the region of waveform shown in the view.
   *
   * @param {Number} frameOffset The new frame offset, in pixels.
   */

  WaveformZoomView.prototype.updateWaveform = function(frameOffset) {
    var upperLimit;

    if (this.pixelLength < this.width) {
      // Total waveform is shorter than viewport, so reset the offset to 0.
      frameOffset = 0;
      upperLimit = this.width;
    }
    else {
      // Calculate the very last possible position.
      upperLimit = this.pixelLength - this.width;
    }

    frameOffset = Utils.clamp(frameOffset, 0, upperLimit);

    this.frameOffset = frameOffset;

    // Display playhead if it is within the zoom frame width.
    var playheadPixel = this._playheadLayer.getPlayheadPixel();

    this._playheadLayer.updatePlayheadTime(this.pixelsToTime(playheadPixel));

    this.waveformLayer.draw();

    var frameStartTime = this.pixelsToTime(this.frameOffset);
    var frameEndTime   = this.pixelsToTime(this.frameOffset + this.width);

    this._pointsLayer.updatePoints(frameStartTime, frameEndTime);
    this._segmentsLayer.updateSegments(frameStartTime, frameEndTime);

    this.peaks.emit('zoomview.displaying', frameStartTime, frameEndTime);
  };

  WaveformZoomView.prototype.beginZoom = function() {
    // Fade out the time axis and the segments
    // this.axis.axisShape.setAttr('opacity', 0);

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

    var time = this.peaks.player.getCurrentTime();

    this.seekFrame(this.timeToPixels(time));
  };

  WaveformZoomView.prototype.destroy = function() {
    if (this.stage) {
      this.stage.destroy();
      this.stage = null;
    }
  };

  return WaveformZoomView;
});
