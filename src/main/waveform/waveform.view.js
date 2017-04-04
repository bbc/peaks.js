/**
 * @file
 *
 * Defines the {@link WaveformView} class.
 *
 * @module peaks/waveform/waveform.view
 */
define([
  'peaks/waveform/waveform.axis',
  'peaks/waveform/waveform.mixins',
  'peaks/waveform/waveform.utils',
  'konva'
  ], function(
    WaveformAxis,
    mixins,
    Utils,
    Konva) {
  'use strict';

  /**
   * Creates a waveform view.
   *
   * @class
   * @alias WaveformView
   *
   * @param {WaveformData} options.waveformData
   * @param {HTMLElement} options.container
   * @param {Peaks} options.peaks
   * @param {ZoomAdapter} options.zoomAdapter
   * @param {MouseDragHandler} options.mouseDragHandler
   */
  function WaveformView(name, options) {
    var self = this;

    if (!options.waveformData) {
      throw new Error('WaveformView requires `options.waveformData` to be a WaveformData object');
    }

    if (!options.container) {
      throw new Error('WaveformView requires `options.container` to be a DOM element');
    }

    if (!options.peaks) {
      throw new Error('WaveformView requires `options.peaks` to be a peaks instance');
    }

    if (!options.zoomAdapter) {
      throw new Error('WaveformView requires `options.zoomAdapter` to be a views/zooms instance');
    }

    if (!options.mouseDragHandler) {
      throw new Error('WaveformView requires `options.mouseDragHandler` to be a views/pointers instance');
    }

    var peaksOptions = options.peaks.options;

    self.name = name;
    self.waveformData = options.waveformData;
    self.container = options.container;
    self.peaks = options.peaks;
    self.zoomAdapter = options.zoomAdapter;

    self.playing = false;

    self.data = self.waveformData.resample(options.scale);
    self.playheadPixel = self.data.at_time(peaksOptions.mediaElement.currentTime);
    self.pixelLength = self.data.adapter.length;
    self.frameOffset = 0; // the pixel offset of the current frame being displayed

    self.width = self.container.clientWidth;
    self.height = self.container.clientHeight || peaksOptions.height;

    self.data.offset(self.frameOffset, self.frameOffset + self.width);

    self.stage = new Konva.Stage({
      container: self.container,
      width: self.width,
      height: self.height
    });

    self.backgroundLayer = new Konva.Layer();
    self.waveformLayer = new Konva.FastLayer();
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

    self._mouseDragHandler = options.mouseDragHandler.create(self);
    self.createWaveform();
    self.createUi();

    // EVENTS ====================================================

    function userSeekHandler(time) {
      var frameIndex = self.data.at_time(time);

      self.seekFrame(frameIndex, Math.round(self.width / 2));

      if (self.playing) {
        self.playFrom(time, frameIndex);
      }
    }

    self.peaks.on('player_time_update', function(time) {
      if (!self._mouseDragHandler.isDragging()) {
        self.seekFrame(self.data.at_time(time));
      }
    });

    self.peaks.on('player_seek', userSeekHandler);

    self.peaks.on('user_scroll.' + self.name, function(pixelOffset) {
      self.updateWaveform(pixelOffset);
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
      // We currently don't allow changing the zoom level during playback.
      if (self.playing) {
        return;
      }

      if (currentScale === previousScale) {
        return;
      }

      self.zoomAdapter.create(currentScale, previousScale, self)
                      .start();
    });

    self.peaks.on('window_resize', function() {
      self.container.hidden = true;
    });

    self.peaks.on('window_resize_complete', function(width) {
      self.width = width;
      self.stage.setWidth(self.width);
      self.updateWaveform(self.frameOffset);
      self.container.removeAttribute('hidden');
    });

    // KEYBOARD EVENTS =========================================

    function nudgeFrame(step) {
      var time = self.peaks.options.mediaElement.currentTime;

      time += self.peaks.options.nudgeIncrement * step;
      self.seekFrame(self.data.at_time(time));
    }

    self.peaks.on('keyboard.left', nudgeFrame.bind(self, -1));
    self.peaks.on('keyboard.right', nudgeFrame.bind(self, 1));
    self.peaks.on('keyboard.shift_left', nudgeFrame.bind(self, -10));
    self.peaks.on('keyboard.shift_right', nudgeFrame.bind(self, 10));
  }

  WaveformView.prototype.emit = function() {
    var name = [arguments[0], this.name].join('.');
    var args = Array.prototype.slice.call(arguments, 1);

    this.peaks.emit.apply(this.peaks, [name].concat(args));
  };

  // WAVEFORM ZOOMVIEW FUNCTIONS =========================================

  WaveformView.prototype.createWaveform = function() {
    this.waveformShape = new Konva.Shape({
      fill: this.peaks.options.zoomWaveformColor,
      strokeWidth: 0
    });

    this.waveformShape.sceneFunc(
      mixins.waveformDrawFunction.bind(this.waveformShape, this)
    );

    this.waveformLayer.add(this.waveformShape);
    this.stage.add(this.waveformLayer);

    this.emit(
      'waveform.render',
      0 * this.data.seconds_per_pixel,
      this.width * this.data.seconds_per_pixel
    );
  };

  WaveformView.prototype.createUi = function() {
    this.playheadLine = new Konva.Line({
      points: [0.5, 0, 0.5, this.height],
      stroke: this.peaks.options.playheadColor,
      strokeWidth: 1
    });

    this.playheadText = new Konva.Text({
      x: 2,
      y: 12,
      text: '00:00:00',
      fontSize: 11,
      fontFamily: 'sans-serif',
      fill: this.peaks.options.playheadTextColor,
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

  WaveformView.prototype.updateWaveform = function(pixelOffset) {
    if (isNaN(pixelOffset)) {
      // eslint-disable-next-line max-len
      throw new Error('WaveformView#updateWaveform passed a pixel offset that is not a number: ' + pixelOffset);
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
    this.waveformLayer.draw();

    this.emit(
      'waveform.render',
      pixelOffset * this.data.seconds_per_pixel,
      (pixelOffset + this.width) * this.data.seconds_per_pixel
    );
  };

  // UI functions ==============================

  /**
   * Creates a playhead animation in sync with the media playback.
   *
   * @param {Number} time Position in time where the playhead starts
   * @param {Integer} start Position in frame index where the playhead starts
   */
  WaveformView.prototype.playFrom = function(time, startPosition) {
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

  WaveformView.prototype.newFrame = function(frameOffset) {
    if (isNaN(frameOffset)) {
      // eslint-disable-next-line max-len
      throw new Error('WaveformView#newFrame passed a frame offset that is not a number: ' + frameOffset);
    }

    var nextOffset = frameOffset + this.width;

    if (nextOffset < this.data.adapter.length) {
      this.frameOffset = nextOffset;
      this.updateWaveform(nextOffset);

      return true;
    }

    return false;
  };

  WaveformView.prototype.syncPlayhead = function(pixelIndex) {
    if (isNaN(pixelIndex)) {
      // eslint-disable-next-line max-len
      throw new Error('WaveformView#syncPlayhead passed a pixel index that is not a number: ' + pixelIndex);
    }

    var display = (pixelIndex >= this.frameOffset) &&
                  (pixelIndex <= this.frameOffset + this.width);

    this.playheadPixel = pixelIndex;

    if (display) {
      // Place playhead at centre of  frame i.e. remPixels = 500
      var remPixels = this.playheadPixel - this.frameOffset;

      this.playheadGroup.show().setAttr('x', remPixels);
      this.playheadText.setText(Utils.niceTime(this.data.time(this.playheadPixel), false));
    }
    else {
      this.playheadGroup.hide();
    }

    this.uiLayer.draw();
  };

  WaveformView.prototype.seekFrame = function(pixelIndex, offset) {
    if (isNaN(pixelIndex)) {
      // eslint-disable-next-line max-len
      throw new Error('WaveformView#seekFrame passed a pixel index that is not a number: ' + pixelIndex);
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
    this.updateWaveform(this.frameOffset);
  };

  WaveformView.prototype.destroy = function() {
    this.stage.destroy();
    this.stage = null;
  };

  return WaveformView;
});
