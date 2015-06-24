/**
 * WAVEFORM.ZOOMVIEW.JS
 *
 * This module handles all functionality related to the zoomed in
 * waveform view canvas and initialises its own instance of the axis
 * object.
 *
 */
define([
  "peaks/waveform/waveform.axis",
  "peaks/waveform/waveform.mixins",
  "peaks/views/zooms/animated",
  "Kinetic"
  ], function (WaveformAxis, mixins, ZoomAnimation, Kinetic) {
  'use strict';

  function WaveformZoomView(waveformData, container, peaks) {
    var that = this;

    that.cur_scale = 0;

    that.peaks = peaks;
    that.options = peaks.options;
    that.rootData = waveformData;

    that.playing = false;

    that.intermediateData = null;
    that.data = that.rootData.resample({
      scale: that.options.zoomLevels[peaks.zoom.getZoom()]
    });
    that.playheadPixel = that.data.at_time(that.options.mediaElement.currentTime);
    that.pixelLength = that.data.adapter.length;
    that.frameOffset = 0; // the pixel offset of the current frame being displayed

    that.width = container.clientWidth;
    that.height = container.clientHeight || that.options.height;

    that.data.offset(that.frameOffset, that.frameOffset + that.width);

    that.stage = new Kinetic.Stage({
      container: container,
      width: that.width,
      height: that.height
    });

    that.zoomWaveformLayer = new Kinetic.Layer();
    that.uiLayer = new Kinetic.Layer();

    that.background = new Kinetic.Rect({
      x: 0,
      y: 0,
      width: that.width,
      height: that.height
    });

    that.zoomWaveformLayer.add(that.background);

    that.axis = new WaveformAxis(that);

    that.createZoomWaveform();
    that.createUi();

    // INTERACTION ===============================================

    that.stage.on("mousedown", function (event) {
      if (event.target &&
        !event.target.attrs.draggable &&
        !event.target.parent.attrs.draggable) {
        if (event.type === "mousedown") {
          var x = event.evt.layerX, dX, p;
          peaks.seeking = true;

          // enable drag if necessary
          that.stage.on("mousemove", function (event) {
            peaks.seeking = false;

            dX = event.evt.layerX > x ? x - event.evt.layerX : (x - event.evt.layerX)*1;
            x = event.evt.layerX;
            p = that.frameOffset+dX;
            p = p < 0 ? 0 : p > (that.pixelLength - that.width) ? (that.pixelLength - that.width) : p;

            that.updateZoomWaveform(p);
          });

          that.stage.on("mouseup", function () {
            if (peaks.seeking){
              // Set playhead position only on click release, when not dragging
              that.peaks.emit("user_seek.zoomview", that.data.time(that.frameOffset + x), that.frameOffset + x);
            }

            that.stage.off("mousemove mouseup");
            peaks.seeking = false;
          });
        }
      }
    });

    // EVENTS ====================================================

    var userSeekHandler = function userSeekHandler (options, time) {
      options = options || { withOffset: true };
      var frameIndex = that.data.at_time(time);

      that.seekFrame(frameIndex, options.withOffset ? Math.round(that.width / 2) : 0);

      if (that.playing){
        that.playFrom(time, frameIndex);
      }
    };

    that.peaks.on("player_time_update", function (time) {
      if (!peaks.seeking) {
        that.seekFrame(that.data.at_time(time));
      }
    });

    that.peaks.on("player_seek", userSeekHandler.bind(null, { withOffset: true }));
    that.peaks.on("user_seek.*", userSeekHandler.bind(null, { withOffset: true }));
    that.peaks.on("user_scrub.*", userSeekHandler.bind(null, { withOffset: false }));

    that.peaks.on("player_play", function (time) {
      that.playing = true;
      that.playFrom(time, that.data.at_time(time));
    });

    that.peaks.on("player_pause", function (time) {
      that.playing = false;

      if (that.playheadLineAnimation) {
        that.playheadLineAnimation.stop();
      }

      that.syncPlayhead(that.data.at_time(time));
    });

    that.peaks.on("zoom.update", function (current_scale, previous_scale) {
      if (that.playing) {
        return;
      }

      if (current_scale !== previous_scale) {
        that.data = that.rootData.resample({
          scale: current_scale
        });

        var animation = ZoomAnimation.init(current_scale, previous_scale, that);
        animation.start();
      }
    });

    that.peaks.on("window_resized", function (width, newWaveformData) {
      that.width = width;
      that.data = newWaveformData;
      that.stage.setWidth(that.width);
      that.updateZoomWaveform(that.frameOffset);
      that.peaks.emit("zoomview_resized");
    });

    // KEYBOARD EVENTS =========================================
    var nudgeFrame = function nudgeFrame(step){
      var time = that.options.mediaElement.currentTime;

      time += (that.options.nudgeIncrement * step);
      that.seekFrame(that.data.at_time(time));
    };

    that.peaks.on("kybrd_left", nudgeFrame.bind(that, -1));
    that.peaks.on("kybrd_right", nudgeFrame.bind(that, 1));
    that.peaks.on("kybrd_shift_left", nudgeFrame.bind(that, -10));
    that.peaks.on("kybrd_shift_right", nudgeFrame.bind(that, 10));
  }

  // WAVEFORM ZOOMVIEW FUNCTIONS =========================================

  WaveformZoomView.prototype.createZoomWaveform = function() {
    var that = this;
    that.zoomWaveformShape = new Kinetic.Shape({
      fill: that.options.zoomWaveformColor,
      strokeWidth: 0
    });

    that.zoomWaveformShape.setDrawFunc(mixins.waveformDrawFunction.bind(that.zoomWaveformShape, that));

    that.zoomWaveformLayer.add(that.zoomWaveformShape);
    that.stage.add(that.zoomWaveformLayer);
    that.peaks.emit("waveform_zoom_displaying", 0 * that.data.seconds_per_pixel, that.width * that.data.seconds_per_pixel);
  };

  WaveformZoomView.prototype.createUi = function() {
    var that = this;

    that.zoomPlayheadLine = new Kinetic.Line({
      points: [0.5, 0, 0.5, that.height],
      stroke: that.options.playheadColor,
      strokeWidth: 1
    });

    that.zoomPlayheadText = new Kinetic.Text({
      x:2,
      y: 12,
      text: "00:00:00",
      fontSize: 11,
      fontFamily: 'sans-serif',
      fill: '#aaa',
      align: 'right'
    });

    that.zoomPlayheadGroup = new Kinetic.Group({
      x: 0,
      y: 0
    }).add(that.zoomPlayheadLine).add(that.zoomPlayheadText);

    that.uiLayer.add(that.zoomPlayheadGroup);
    that.stage.add(that.uiLayer);

    that.zoomPlayheadGroup.moveToTop();
  };

  WaveformZoomView.prototype.updateZoomWaveform = function (pixelOffset) {
    if (isNaN(pixelOffset)) throw new Error("WaveformZoomView#updateZoomWaveform passed a pixel offset that is not a number: " + pixelOffset);

    var that = this;

    that.frameOffset = pixelOffset;
    that.pixelLength = that.data.adapter.length;
    that.data.offset(pixelOffset, pixelOffset + that.width);

    var display = (that.playheadPixel >= pixelOffset) && (that.playheadPixel <= pixelOffset + that.width); //i.e. playhead is within the zoom frame width

    if (display) {
      var remPixels = that.playheadPixel - pixelOffset;

      that.zoomPlayheadGroup.show().setAttr("x", remPixels);
      that.zoomPlayheadText.setText(mixins.niceTime(that.data.time(that.playheadPixel), false));
    }
    else {
      that.zoomPlayheadGroup.hide();
    }

    that.uiLayer.draw();
    that.zoomWaveformLayer.draw();

    // if (that.snipWaveformShape) that.updateSnipWaveform(that.currentSnipStartTime, that.currentSnipEndTime);

    that.peaks.emit("waveform_zoom_displaying", pixelOffset * that.data.seconds_per_pixel, (pixelOffset+that.width) * that.data.seconds_per_pixel);
  };

  // UI functions ==============================

  /**
   * Create a playhead animation in sync with the audio playback.
   *
   * @param {Number} time Position in time where the playhead starts
   * @param {Integer} startPosition Position in frame index where the playhead starts
   */
  WaveformZoomView.prototype.playFrom = function (time, startPosition) {
    var that = this;

    if (that.playheadLineAnimation) {
      that.playheadLineAnimation.stop();
    }

    var frameSeconds = 0;
    var pixelsPerSecond = that.data.pixels_per_second;

    that.playheadLineAnimation = new Kinetic.Animation(function (frame) {
      var time = frame.time;

      var seconds = time / 1000;
      var positionInFrame = Math.round(startPosition - that.frameOffset + (pixelsPerSecond * (seconds-frameSeconds)));

      that.syncPlayhead(that.frameOffset + positionInFrame);
    }, that.uiLayer);

    that.playheadLineAnimation.start();
  };

  WaveformZoomView.prototype.newFrame = function (frameOffset) {
    if (isNaN(frameOffset)) throw new Error("WaveformZoomView#newFrame passed a frame offset that is not a number: " + frameOffset);

    var nextOffset = frameOffset + this.width;

    if (nextOffset < this.data.adapter.length){
      this.frameOffset = nextOffset;
      this.updateZoomWaveform(nextOffset);

      return true;
    }

    return false;
  };

  WaveformZoomView.prototype.syncPlayhead = function (pixelIndex) {
    if (isNaN(pixelIndex)) throw new Error("WaveformZoomView#syncPlayhead passed a pixel index that is not a number: " + pixelIndex);

    var that = this;
    var display = (pixelIndex >= that.frameOffset) && (pixelIndex <= that.frameOffset + that.width);

    that.playheadPixel = pixelIndex;

    if (display) {
      var remPixels = that.playheadPixel - that.frameOffset; //places playhead at centre of zoom frame i.e. remPixels = 500
      that.zoomPlayheadGroup.show().setAttr("x", remPixels);
      that.zoomPlayheadText.setText(mixins.niceTime(that.data.time(that.playheadPixel), false));
    }
    else {
      that.zoomPlayheadGroup.hide();
    }

    that.uiLayer.draw();
  };

  WaveformZoomView.prototype.seekFrame = function (pixelIndex, offset) {
    if (isNaN(pixelIndex)) throw new Error("WaveformZoomView#seekFrame passed a pixel index that is not a number: " + pixelIndex);

    var that = this;
    var upperLimit = that.data.adapter.length - that.width;
    var direction = pixelIndex < that.data.offset_start ? 'backwards' : 'onwards';

    if (!that.data.in_offset(pixelIndex)) {
      that.frameOffset = pixelIndex - Math.round(that.width / 2);
      if (that.frameOffset <= 0) {
        that.frameOffset = 0;
      } else if (that.frameOffset + that.width >= that.data.adapter.length) {
        that.frameOffset = upperLimit;
      }
    }

    that.syncPlayhead(pixelIndex);
    that.updateZoomWaveform(that.frameOffset);
  };

  return WaveformZoomView;
});
