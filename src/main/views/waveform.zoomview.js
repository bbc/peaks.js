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

    self.intermediateData = null;
    self.data = self.originalWaveformData.resample({
      scale: self.options.zoomLevels[peaks.zoom.getZoom()]
    });
    self.playheadPixel = self.data.at_time(self.options.mediaElement.currentTime);
    self.pixelLength = self.data.adapter.length;
    self.frameOffset = 0; // the pixel offset of the current frame being displayed

    self.width = container.clientWidth;
    self.height = container.clientHeight || self.options.height;

    self.data.offset(self.frameOffset, self.frameOffset + self.width);

    self.stage = new Konva.Stage({
      container: container,
      width: self.width,
      height: self.height
    });

    self.backgroundLayer = new Konva.Layer();
    self.zoomWaveformLayer = new Konva.FastLayer();
    self.uiLayer = new Konva.Layer();

    self.background = new Konva.Rect({
      x: 0,
      y: 0,
      width: self.width,
      height: self.height
    });

    self.backgroundLayer.add(self.background);
    self.stage.add(self.backgroundLayer);

    self.axis = new WaveformAxis(self);

    self.createZoomWaveform();
    self.createUi();

    self.mouseDragHandler = new MouseDragHandler(self.stage, {
      onMouseDown: function(mousePosX) {
        this.initialFrameOffset = self.frameOffset;
        this.mouseDownX = mousePosX;
      },

      onMouseMove: function(mousePosX) {
        // Moving the mouse to the left increases the time position of the
        // left-hand edge of the visible waveform.
        var diff = this.mouseDownX - mousePosX;

        var newFrameOffset = this.initialFrameOffset + diff;

        if (newFrameOffset < 0) {
          newFrameOffset = 0;
        }
        else if (newFrameOffset > (self.pixelLength - self.width)) {
          newFrameOffset = self.pixelLength - self.width;
        }

        if (newFrameOffset !== this.initialFrameOffset) {
          self.peaks.emit('user_scroll.zoomview', newFrameOffset);
        }
      },

      onMouseUp: function(mousePosX) {
        // Set playhead position only on click release, when not dragging
        if (!self.mouseDragHandler.isDragging()) {
          var pos = self.frameOffset + this.mouseDownX;

          self.peaks.emit('user_seek.zoomview', self.data.time(pos), pos);
        }
      }
    });

    // EVENTS ====================================================

    function userSeekHandler(time) {
      var frameIndex = self.data.at_time(time);

      self.seekFrame(frameIndex, Math.round(self.width / 2));

      if (self.playing) {
        self.playFrom(time, frameIndex);
      }
    }

    self.peaks.on('player_time_update', function(time) {
      if (!self.mouseDragHandler.isDragging()) {
        self.seekFrame(self.data.at_time(time));
      }
    });

    self.peaks.on('player_seek', userSeekHandler);

    self.peaks.on('user_scroll.zoomview', function(pixelOffset) {
      self.updateZoomWaveform(pixelOffset);
    });

    self.peaks.on('player_play', function(time) {
      self.playing = true;
      self.playFrom(time, self.data.at_time(time));
    });

    self.peaks.on('player_pause', function(time) {
      self.playing = false;

      if (self.playheadLineAnimation) {
        self.playheadLineAnimation.stop();
      }

      self.syncPlayhead(self.data.at_time(time));
    });

    self.peaks.on('zoom.update', function(currentScale, previousScale) {
      if (self.playing) {
        // We currently don't allow changing the zoom level during playback.
        return;
      }

      if (currentScale === previousScale) {
        // Nothing to do.
        return;
      }

      self.data = self.originalWaveformData.resample({
        scale: currentScale
      });

      var zoomAdapterMap = {
        'animated': AnimatedZoomAdapter,
        'static': StaticZoomAdapter
      };

      var zoomAdapter = zoomAdapterMap[self.peaks.options.zoomAdapter];

      if (!zoomAdapter) {
        throw new Error('Invalid zoomAdapter: ' + self.peaks.options.zoomAdapter);
      }

      var adapter = zoomAdapter.create(currentScale, previousScale, self);

      adapter.start();
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

    function nudgeFrame(step) {
      var time = self.options.mediaElement.currentTime;

      time += self.options.nudgeIncrement * step;
      self.seekFrame(self.data.at_time(time));
    }

    self.peaks.on('keyboard.left', nudgeFrame.bind(self, -1));
    self.peaks.on('keyboard.right', nudgeFrame.bind(self, 1));
    self.peaks.on('keyboard.shift_left', nudgeFrame.bind(self, -10));
    self.peaks.on('keyboard.shift_right', nudgeFrame.bind(self, 10));
  }

  // WAVEFORM ZOOMVIEW FUNCTIONS =========================================

  WaveformZoomView.prototype.createZoomWaveform = function() {
    this.zoomWaveformShape = new Konva.Shape({
      fill: this.options.zoomWaveformColor,
      strokeWidth: 0
    });

    this.zoomWaveformShape.sceneFunc(
      mixins.waveformDrawFunction.bind(this.zoomWaveformShape, this)
    );

    this.zoomWaveformLayer.add(this.zoomWaveformShape);
    this.stage.add(this.zoomWaveformLayer);

    this.peaks.emit(
      'zoomview.displaying',
      0 * this.data.seconds_per_pixel,
      this.width * this.data.seconds_per_pixel
    );
  };

  WaveformZoomView.prototype.createUi = function() {
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

    this.playheadGroup.add(this.playheadLine)
                      .add(this.playheadText);

    this.uiLayer.add(this.playheadGroup);
    this.stage.add(this.uiLayer);

    this.playheadGroup.moveToTop();
  };

  WaveformZoomView.prototype.updateZoomWaveform = function(pixelOffset) {
    if (isNaN(pixelOffset)) {
      // eslint-disable-next-line max-len
      throw new Error('WaveformZoomView#updateZoomWaveform passed a pixel offset that is not a number: ' + pixelOffset);
    }

    this.pixelLength = this.data.adapter.length;

    // total waveform is shorter than viewport, so reset the offset to 0
    if (this.pixelLength < this.width) {
      pixelOffset = 0;
    }

    // new position is beyond the size of the waveform, so set it to the very
    // last possible position
    if (pixelOffset > this.pixelLength - this.width) {
      pixelOffset = this.pixelLength - this.width;
    }

    // we must not have a negative pixelOffset
    if (pixelOffset < 0) {
      pixelOffset = 0;
    }

    this.frameOffset = pixelOffset;
    this.data.offset(pixelOffset, Math.min(pixelOffset + this.width, this.pixelLength));

    // Display playhead if it is within the zoom frame width
    var display = (this.playheadPixel >= pixelOffset) &&
                  (this.playheadPixel <= pixelOffset + this.width);

    if (display) {
      var remPixels = this.playheadPixel - pixelOffset;

      this.playheadGroup.show().setAttr('x', remPixels);
      this.playheadText.setText(Utils.niceTime(this.data.time(this.playheadPixel), false));
    }
    else {
      this.playheadGroup.hide();
    }

    this.uiLayer.draw();
    this.zoomWaveformLayer.draw();

    // if (this.snipWaveformShape) {
    //   this.updateSnipWaveform(this.currentSnipStartTime, this.currentSnipEndTime);
    // }

    this.peaks.emit(
      'zoomview.displaying',
      pixelOffset * this.data.seconds_per_pixel,
      (pixelOffset + this.width) * this.data.seconds_per_pixel
    );
  };

  // UI functions ==============================

  /**
   * Creates a playhead animation in sync with the media playback.
   *
   * @param {Number} time Position in time where the playhead starts
   * @param {Integer} start Position Position in frame index where the playhead starts
   */
  WaveformZoomView.prototype.playFrom = function(time, startPosition) {
    var self = this;

    if (self.playheadLineAnimation) {
      self.playheadLineAnimation.stop();
    }

    var frameSeconds = 0;
    var pixelsPerSecond = self.data.pixels_per_second;

    self.playheadLineAnimation = new Konva.Animation(function(frame) {
      var time = frame.time;
      var seconds = time / 1000;

      var positionInFrame = Math.round(
        startPosition -
        self.frameOffset +
        (pixelsPerSecond * (seconds - frameSeconds))
      );

      self.syncPlayhead(self.frameOffset + positionInFrame);
    }, self.uiLayer);

    self.playheadLineAnimation.start();
  };

  WaveformZoomView.prototype.newFrame = function(frameOffset) {
    if (isNaN(frameOffset)) {
      // eslint-disable-next-line max-len
      throw new Error('WaveformZoomView#newFrame passed a frame offset that is not a number: ' + frameOffset);
    }

    var nextOffset = frameOffset + this.width;

    if (nextOffset < this.data.adapter.length) {
      this.frameOffset = nextOffset;
      this.updateZoomWaveform(nextOffset);

      return true;
    }

    return false;
  };

  WaveformZoomView.prototype.syncPlayhead = function(pixelIndex) {
    if (isNaN(pixelIndex)) {
      // eslint-disable-next-line max-len
      throw new Error('WaveformZoomView#syncPlayhead passed a pixel index that is not a number: ' + pixelIndex);
    }

    var display = (pixelIndex >= this.frameOffset) &&
                  (pixelIndex <= this.frameOffset + this.width);

    this.playheadPixel = pixelIndex;

    if (display) {
      // Place playhead at centre of zoom frame i.e. remPixels = 500
      var remPixels = this.playheadPixel - this.frameOffset;

      this.playheadGroup.show().setAttr('x', remPixels);
      this.playheadText.setText(Utils.niceTime(this.data.time(this.playheadPixel), false));
    }
    else {
      this.playheadGroup.hide();
    }

    this.uiLayer.draw();
  };

  WaveformZoomView.prototype.seekFrame = function(pixelIndex, offset) {
    if (isNaN(pixelIndex)) {
      // eslint-disable-next-line max-len
      throw new Error('WaveformZoomView#seekFrame passed a pixel index that is not a number: ' + pixelIndex);
    }

    var upperLimit = this.data.adapter.length - this.width;

    if (!this.data.in_offset(pixelIndex)) {
      this.frameOffset = pixelIndex - Math.round(this.width / 2);

      if (this.frameOffset <= 0) {
        this.frameOffset = 0;
      }
      else if (this.frameOffset + this.width >= this.data.adapter.length) {
        this.frameOffset = upperLimit;
      }
    }

    this.syncPlayhead(pixelIndex);
    this.updateZoomWaveform(this.frameOffset);
  };

  WaveformZoomView.prototype.destroy = function() {
    this.stage.destroy();
    this.stage = null;
  };

  return WaveformZoomView;
});
