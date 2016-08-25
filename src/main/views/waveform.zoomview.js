/**
 * WAVEFORM.ZOOMVIEW.JS
 *
 * This module handles all functionality related to the zoomed in
 * waveform view canvas and initialises its own instance of the axis
 * object.
 *
 */
define([
  'peaks/waveform/waveform.axis',
  'peaks/waveform/waveform.mixins',
  'peaks/views/zooms/animated',
  'peaks/views/zooms/static',
  'konva'
  ], function(WaveformAxis, mixins, AnimatedZoomAdapter, StaticZoomAdapter, Konva) {
  'use strict';

  function WaveformZoomView(waveformData, container, peaks) {
    var self = this;

    self.peaks = peaks;
    self.options = peaks.options;
    self.rootData = waveformData;

    self.playing = false;

    self.intermediateData = null;
    self.data = self.rootData.resample({
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

    // INTERACTION ===============================================

    self.stage.on('mousedown', function(event) {
      if (event.target &&
        !event.target.attrs.draggable &&
        !event.target.parent.attrs.draggable) {
        if (event.type === 'mousedown') {
          var x = event.evt.layerX, dX, p;

          peaks.seeking = true;

          // enable drag if necessary
          self.stage.on('mousemove', function(event) {
            peaks.seeking = false;

            dX = event.evt.layerX > x ? x - event.evt.layerX : (x - event.evt.layerX) * 1;
            x = event.evt.layerX;
            p = self.frameOffset + dX;

            if (p < 0) {
              p = 0;
            }
            else if (p > (self.pixelLength - self.width)) {
              p = self.pixelLength - self.width;
            }

            self.updateZoomWaveform(p);
          });

          self.stage.on('mouseup', function() {
            if (peaks.seeking) {
              // Set playhead position only on click release, when not dragging
              self.peaks.emit(
                'user_seek.zoomview',
                self.data.time(self.frameOffset + x),
                self.frameOffset + x
              );
            }

            self.stage.off('mousemove mouseup');
            peaks.seeking = false;
          });
        }
      }
    });

    // EVENTS ====================================================

    function userSeekHandler(options, time) {
      options = options || { withOffset: true };
      var frameIndex = self.data.at_time(time);

      self.seekFrame(frameIndex, options.withOffset ? Math.round(self.width / 2) : 0);

      if (self.playing) {
        self.playFrom(time, frameIndex);
      }
    }

    self.peaks.on('player_time_update', function(time) {
      if (!peaks.seeking) {
        self.seekFrame(self.data.at_time(time));
      }
    });

    self.peaks.on('player_seek', userSeekHandler.bind(null, { withOffset: true }));
    self.peaks.on('user_seek.*', userSeekHandler.bind(null, { withOffset: true }));
    self.peaks.on('user_scrub.*', userSeekHandler.bind(null, { withOffset: false }));

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
        return;
      }

      if (currentScale !== previousScale) {
        self.data = self.rootData.resample({
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
      }
    });

    self.peaks.on('window_resized', function(width, newWaveformData) {
      self.width = width;
      self.data = newWaveformData;
      self.stage.setWidth(self.width);
      self.updateZoomWaveform(self.frameOffset);
      self.peaks.emit('zoomview_resized');
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
      'waveform_zoom_displaying',
      0 * this.data.seconds_per_pixel,
      this.width * this.data.seconds_per_pixel
    );
  };

  WaveformZoomView.prototype.createUi = function() {
    this.zoomPlayheadLine = new Konva.Line({
      points: [0.5, 0, 0.5, this.height],
      stroke: this.options.playheadColor,
      strokeWidth: 1
    });

    this.zoomPlayheadText = new Konva.Text({
      x: 2,
      y: 12,
      text: '00:00:00',
      fontSize: 11,
      fontFamily: 'sans-serif',
      fill: this.options.playheadTextColor,
      align: 'right'
    });

    this.zoomPlayheadGroup = new Konva.Group({
      x: 0,
      y: 0
    });

    this.zoomPlayheadGroup.add(this.zoomPlayheadLine)
                          .add(this.zoomPlayheadText);

    this.uiLayer.add(this.zoomPlayheadGroup);
    this.stage.add(this.uiLayer);

    this.zoomPlayheadGroup.moveToTop();
  };

  WaveformZoomView.prototype.updateZoomWaveform = function(pixelOffset) {
    if (isNaN(pixelOffset)) {
      throw new Error('WaveformZoomView#updateZoomWaveform passed a pixel offset that is not a number: ' + pixelOffset);
    }

    this.pixelLength = this.data.adapter.length;

    // total waveform is shorter than viewport, so reset the offset to 0
    if (this.pixelLength < this.width) {
      pixelOffset = 0;
    }

    // new position is beyond the size of the waveform, so set it to the very
    // last possible position
    if (pixelOffset > this.pixelLength) {
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

      this.zoomPlayheadGroup.show().setAttr('x', remPixels);
      this.zoomPlayheadText.setText(mixins.niceTime(this.data.time(this.playheadPixel), false));
    }
    else {
      this.zoomPlayheadGroup.hide();
    }

    this.uiLayer.draw();
    this.zoomWaveformLayer.draw();

    // if (this.snipWaveformShape) {
    //   this.updateSnipWaveform(this.currentSnipStartTime, this.currentSnipEndTime);
    // }

    this.peaks.emit(
      'waveform_zoom_displaying',
      pixelOffset * this.data.seconds_per_pixel,
      (pixelOffset + this.width) * this.data.seconds_per_pixel
    );
  };

  // UI functions ==============================

  /**
   * Create a playhead animation in sync with the audio playback.
   *
   * @param {Number} time Position in time where the playhead starts
   * @param {Integer} startPosition Position in frame index where the playhead starts
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
      throw new Error('WaveformZoomView#syncPlayhead passed a pixel index that is not a number: ' + pixelIndex);
    }

    var display = (pixelIndex >= this.frameOffset) &&
                  (pixelIndex <= this.frameOffset + this.width);

    this.playheadPixel = pixelIndex;

    if (display) {
      // Place playhead at centre of zoom frame i.e. remPixels = 500
      var remPixels = this.playheadPixel - this.frameOffset;

      this.zoomPlayheadGroup.show().setAttr('x', remPixels);
      this.zoomPlayheadText.setText(mixins.niceTime(this.data.time(this.playheadPixel), false));
    }
    else {
      this.zoomPlayheadGroup.hide();
    }

    this.uiLayer.draw();
  };

  WaveformZoomView.prototype.seekFrame = function(pixelIndex, offset) {
    if (isNaN(pixelIndex)) {
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
