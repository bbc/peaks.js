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
  'peaks/views/helpers/mousedraghandler',
  'peaks/views/zooms/animated',
  'peaks/views/zooms/static',
  'konva'
  ], function(
    WaveformAxis,
    mixins,
    Utils,
    MouseDragHandler,
    AnimatedZoomAdapter,
    StaticZoomAdapter,
    Konva) {
  'use strict';

  /**
   * Creates the zoomed-in waveform view.
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

    self.playing = false;
    self.playheadVisible = false;

    self.data = null;
    self.pixelLength = 0;
    self.intermediateData = null;

    self.resampleData(self.options.zoomLevels[peaks.zoom.getZoom()]);

    self.playheadPixel = self.timeToPixels(self.options.mediaElement.currentTime);

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
    self.waveformLayer = new Konva.FastLayer();
    self.playheadLayer = new Konva.Layer();

    self.background = new Konva.Rect({
      x: 0,
      y: 0,
      width: self.width,
      height: self.height
    });

    self.backgroundLayer.add(self.background);
    self.stage.add(self.backgroundLayer);

    self.axis = new WaveformAxis(self, self.waveformLayer);

    self.createWaveform();
    self.createPlayhead();

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

          self.updateZoomWaveform(pixelIndex - mouseDownX);
          self.syncPlayhead(pixelIndex);

          self.peaks.player.seek(time);

          if (self.playing) {
            self.playFrom(time);
          }
        }
      }
    });

    // EVENTS ====================================================

    self.peaks.on('player_time_update', function(time) {
      if (self.mouseDragHandler.isDragging()) {
        return;
      }

      var pixelIndex = self.timeToPixels(time);

      self.syncPlayhead(pixelIndex);

      if (self.playing) {
        // Check for the playhead reaching the right-hand side of the window.

        // TODO: move this code to animation function?
        // TODO: don't scroll if user has positioned view manually (e.g., using
        // the keyboard)
        var playheadPos = pixelIndex - self.frameOffset;

        var endThreshold = self.width - 100;

        if (playheadPos >= endThreshold) {
          self.frameOffset += self.width - 200;

          self.updateZoomWaveform(self.frameOffset);
        }
      }
    });

    self.peaks.on('user_seek.overview', function(time) {
      var frameIndex = self.timeToPixels(time);

      self.updateZoomWaveform(frameIndex - Math.floor(self.width / 2));
      self.syncPlayhead(frameIndex);

      if (self.playing) {
        self.playFrom(time);
      }
    });

    self.peaks.on('user_seek.overview.end', function() {
    });

    // self.peaks.on('player_seek', userSeekHandler);

    self.peaks.on('user_scroll.zoomview', function(pixelOffset) {
      self.updateZoomWaveform(pixelOffset);
    });

    self.peaks.on('player_play', function(time) {
      self.playing = true;
      self.playFrom(time);
    });

    self.peaks.on('player_pause', function(time) {
      self.playing = false;

      if (self.playheadLineAnimation) {
        self.playheadLineAnimation.stop();
      }

      self.syncPlayhead(self.timeToPixels(time));
    });

    self.peaks.on('zoom.update', function(currentScale, previousScale) {
      if (currentScale === previousScale) {
        // Nothing to do.
        return;
      }

      var currentTime = self.peaks.player.getCurrentTime();
      var apexTime;
      var playheadOffsetPixels = self.playheadPixel - self.frameOffset;

      if (playheadOffsetPixels >= 0 && playheadOffsetPixels < self.width) {
        // Playhead is visible. Change the zoom level while keeping the
        // playhead at the same position in the window.
        apexTime = currentTime;
      }
      else {
        // Playhead is not visible. Change the zoom level while keeping the
        // centre of the window at the same position in the waveform.
        playheadOffsetPixels = self.width / 2;
        apexTime = self.pixelsToTime(self.frameOffset + playheadOffsetPixels);
      }

      self.resampleData(currentScale);

      var apexPixel = self.timeToPixels(apexTime);

      self.frameOffset = apexPixel - playheadOffsetPixels;

      self.updateZoomWaveform(self.frameOffset);

      // Update the playhead position after zooming. This is done automatically
      // by the playhead animation if the media is playing.
      if (!self.playing) {
        var playheadPixel = self.timeToPixels(currentTime);

        self.syncPlayhead(playheadPixel);
      }

      // var adapter = self.createZoomAdapter(currentScale, previousScale);

      // adapter.start(relativePosition);
    });

    peaks.on('window_resize', function() {
      self.container.hidden = true;
    });

    self.peaks.on('window_resize_complete', function(width) {
      self.width = width;
      self.stage.setWidth(self.width);
      self.updateZoomWaveform(self.frameOffset);
      self.container.removeAttribute('hidden');
    });

    // KEYBOARD EVENTS =========================================

    function nudgeFrame(direction, large) {
      var increment;

      if (large) {
        increment = direction * self.width;
      }
      else {
        increment = direction * self.timeToPixels(self.options.nudgeIncrement);
      }

      self.updateZoomWaveform(self.frameOffset + increment);
    }

    self.peaks.on('keyboard.left', nudgeFrame.bind(self, -1, false));
    self.peaks.on('keyboard.right', nudgeFrame.bind(self, 1, false));
    self.peaks.on('keyboard.shift_left', nudgeFrame.bind(self, -1, true));
    self.peaks.on('keyboard.shift_right', nudgeFrame.bind(self, 1, true));
  }

  WaveformZoomView.prototype.resampleData = function(scale) {
    this.data = this.originalWaveformData.resample({ scale: scale });

    this.pixelLength = this.data.adapter.length;
  };

  WaveformZoomView.prototype.timeToPixels = function(time) {
    // this.data.at_time(time);
    return Math.floor(time * this.data.adapter.sample_rate / this.data.adapter.scale);
  };

  WaveformZoomView.prototype.pixelsToTime = function(pixels) {
    // this.data.time(pixels);
    return pixels * this.data.adapter.scale / this.data.adapter.sample_rate;
  };

  // WAVEFORM ZOOMVIEW FUNCTIONS =========================================

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
          self.height
        );

        context.fillStrokeShape(this);
      }
    });

    this.waveformLayer.add(this.waveformShape);
    this.stage.add(this.waveformLayer);

    this.peaks.emit('zoomview.displaying', 0, this.pixelsToTime(this.width));
  };

  WaveformZoomView.prototype.createPlayhead = function() {
    this.playheadLine = new Konva.Line({
      points: [0.5, 0, 0.5, this.height],
      stroke: this.options.playheadColor,
      strokeWidth: 1
    });

    this.playheadText = new Konva.Text({
      x: 2,
      y: 12,
      text: '00:00:00',
      fontSize: 11,
      fontFamily: 'sans-serif',
      fill: this.options.playheadTextColor,
      align: 'right'
    });

    this.playheadGroup = new Konva.Group({
      x: 0,
      y: 0
    });

    this.playheadGroup.add(this.playheadLine);
    this.playheadGroup.add(this.playheadText);

    this.playheadLayer.add(this.playheadGroup);
    this.stage.add(this.playheadLayer);

    this.playheadGroup.moveToTop();
  };

  /**
   * Updates the region of waveform shown in the view.
   *
   * @param [Number] frameOffset The new frame offset, in pixel units
   */

  WaveformZoomView.prototype.updateZoomWaveform = function(frameOffset) {
    var upperLimit;

    // Total waveform is shorter than viewport, so reset the offset to 0.
    if (this.pixelLength < this.width) {
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
    this.syncPlayhead(this.playheadPixel);

    this.waveformLayer.draw();

    this.peaks.emit(
      'zoomview.displaying',
      this.pixelsToTime(this.frameOffset),
      this.pixelsToTime(this.frameOffset + this.width)
    );
  };

  // UI functions ==============================

  /**
   * Creates a playhead animation in sync with the media playback.
   *
   * @param {Number} startTime Start time of the playhead animation, in seconds.
   */

  WaveformZoomView.prototype.playFrom = function(startTime) {
    var self = this;

    if (self.playheadLineAnimation) {
      self.playheadLineAnimation.stop();
    }

    self.playheadLineAnimation = new Konva.Animation(function(frame) {
      // Elapsed time since animation started (seconds).
      var elapsed = frame.time / 1000;

      // TODO: update playhead position based on player currentTime,
      // to avoid drift?
      var playheadPosition = self.timeToPixels(startTime + elapsed);

      self.syncPlayhead(playheadPosition);
    }, self.playheadLayer);

    self.playheadLineAnimation.start();
  };

  WaveformZoomView.prototype.syncPlayhead = function(pixelIndex) {
    var display = (pixelIndex >= this.frameOffset) &&
                  (pixelIndex <  this.frameOffset + this.width);

    this.playheadPixel = pixelIndex;

    if (display) {
      var playheadX = this.playheadPixel - this.frameOffset;
      var text = Utils.formatTime(this.pixelsToTime(this.playheadPixel), false);

      if (!this.playheadVisible) {
        this.playheadVisible = true;
        this.playheadGroup.show();
      }

      this.playheadGroup.setAttr('x', playheadX);
      this.playheadText.setText(text);

      this.playheadLayer.draw();
    }
    else if (this.playheadVisible) {
      this.playheadVisible = false;
      this.playheadGroup.hide();

      this.playheadLayer.draw();
    }
  };

  WaveformZoomView.prototype.destroy = function() {
    this.stage.destroy();
    this.stage = null;
  };

  return WaveformZoomView;
});
