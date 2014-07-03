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
  "peaks/waveform/waveform.mixins"
  ], function (WaveformAxis, mixins) {
  'use strict';

  function WaveformZoomView(waveformData, container, peaks) {
    var that = this;

    that.peaks = peaks;
    that.options = peaks.options;
    that.rootData = waveformData;
    that.playing = false;
    that.seeking = false;

    that.current_zoom_level = 0;    // to be replaced by peaks.currentZoomLevel when Peaks replaces bootstrap

    that.data = that.rootData.resample({
      scale: that.options.zoomLevels[that.current_zoom_level]
    });

    that.playheadPixel = that.data.at_time(that.options.mediaElement.currentTime);
    that.pixelLength = that.data.adapter.length;
    that.pixelsPerSecond = that.data.pixels_per_second;
    that.frameOffset = 0; // the pixel offset of the current frame being displayed

    that.width = container.clientWidth;
    that.height = container.clientHeight || that.options.height;

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
    that.axis.drawAxis(0);
    that.createUi();

    // INTERACTION ===============================================

    that.stage.on("mousedown", function (event) {
      if (event.targetNode &&
        !event.targetNode.attrs.draggable &&
        !event.targetNode.parent.attrs.draggable) {
        if (event.type == "mousedown") {
          that.seeking = true;
          var x = event.layerX, dX, p;

          // enable drag if necessary
          that.stage.on("mousemove", function (event) {
            dX = event.layerX > x ? x - event.layerX : (x - event.layerX)*1;
            x = event.layerX;
            p = that.frameOffset+dX;
            p = p < 0 ? 0 : p > (that.pixelLength - that.width) ? (that.pixelLength - that.width) : p;
            that.seeking = false;

            that.frameOffset = p;
            that.updateZoomWaveform(p);
          });

          that.stage.on("mouseup", function () {
            that.stage.off("mousemove mouseup");

            if (that.seeking){
              // Set playhead position only on click release, when not dragging
              that.peaks.emit("zoomview_user_seek", that.data.time(that.frameOffset + x), that.frameOffset + x);
            }
          });
        }
      }
    });

    // EVENTS ====================================================

    var userSeekHandler = function userSeekHandler (time) {
      var frameIndex = that.data.at_time(time);

      that.seekFrame(frameIndex);

      if (that.playing){
        that.playFrom(time, frameIndex);
      }
    };

    that.peaks.on("player_time_update", function (time) {
      if (!that.seeking && !that.playing) {
        that.seekFrame(that.data.at_time(time));
      }
    });


    that.peaks.on("player_time_update", function (time) {
      if (!that.seeking && that.playing && !that.data.in_offset(that.data.at_time(time))) {
        that.newFrame(that.frameOffset);
      }
    });

    that.peaks.on("zoomview_user_seek", function (time, frameIndex) {
      that.options.mediaElement.currentTime = time;

      that.syncPlayhead(frameIndex);

      if (that.playing){
        that.playFrom(time, that.data.at_time(time));
      }
    });

    that.peaks.on("waveform_seek", userSeekHandler);
    that.peaks.on("overview_user_seek", userSeekHandler);

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

    that.peaks.on("waveform_zoom_level_changed", function (zoom_level) {
      if (that.playing) {
        return;
      }

      if (zoom_level != that.current_zoom_level) {
        that.current_zoom_level = zoom_level;
        that.data = that.rootData.resample({
          scale: zoom_level
        });

        that.pixelsPerSecond = that.data.pixels_per_second;
        that.seekFrame(that.data.at_time(that.options.mediaElement.currentTime));
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

  WaveformZoomView.prototype.createZoomWaveform = function() {
    var that = this;
    that.zoomWaveformShape = new Kinetic.Shape({
      drawFunc: function(canvas) {
        that.data.offset(0, that.width);

        mixins.waveformDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
      },
      fill: that.options.zoomWaveformColor,
      strokeWidth: 0
    });

    that.zoomWaveformLayer.add(that.zoomWaveformShape);
    that.stage.add(that.zoomWaveformLayer);
    that.peaks.emit("waveform_zoom_displaying", 0 * that.data.seconds_per_pixel, that.width * that.data.seconds_per_pixel);
  };

  WaveformZoomView.prototype.createUi = function() {
    var that = this;

    that.zoomPlayheadLine = new Kinetic.Line({
      points: [{x: 0, y: 0},{x: 0, y: that.height}],
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
  };

  WaveformZoomView.prototype.updateZoomWaveform = function (pixelOffset) {
    var that = this;

    var display = (that.playheadPixel >= pixelOffset) && (that.playheadPixel <= pixelOffset + that.width);
    if (display) {
      var remPixels = that.playheadPixel - pixelOffset;

      that.zoomPlayheadGroup.show().setAttr("x", remPixels + 0.5);
      that.zoomPlayheadText.setText(mixins.niceTime(that.data.time(that.playheadPixel), false));
    }
    else {
      that.zoomPlayheadGroup.hide();
    }

    that.uiLayer.setZIndex(100);
    that.uiLayer.draw();

    that.zoomWaveformShape.setDrawFunc(function(canvas) {
      that.data.offset(pixelOffset, pixelOffset + that.width);

      mixins.waveformDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
    });

    that.zoomWaveformLayer.draw();

    that.axis.drawAxis(that.data.time(pixelOffset));

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

    that.playheadLineAnimation = new Kinetic.Animation(function (frame) {
      var time = frame.time;

      var seconds = time / 1000;
      var positionInFrame = Math.round(startPosition - that.frameOffset + (that.pixelsPerSecond * (seconds-frameSeconds)));

      that.syncPlayhead(that.frameOffset + positionInFrame);
    }, that.uiLayer);

    that.playheadLineAnimation.start();
  };

  WaveformZoomView.prototype.newFrame = function (frameOffset) {
    var nextOffset = frameOffset + this.width;

    if (nextOffset < this.data.adapter.length){
      this.frameOffset = nextOffset;
      this.updateZoomWaveform(nextOffset);

      return true;
    }

    return false;
  };

  WaveformZoomView.prototype.syncPlayhead = function (pixelIndex) {
    var that = this;
    var display = (pixelIndex >= that.frameOffset) && (pixelIndex <= that.frameOffset + that.width);

    that.playheadPixel = pixelIndex;

    if (display) {
      var remPixels = that.playheadPixel - that.frameOffset;
      that.zoomPlayheadGroup.show().setAttr("x", remPixels + 0.5);
      that.zoomPlayheadText.setText(mixins.niceTime(that.data.time(that.playheadPixel), false));
    }
    else {
      that.zoomPlayheadGroup.hide();
    }
  };

  WaveformZoomView.prototype.seekFrame = function (pixelIndex) {
    var that = this;
    var upperLimit = that.data.adapter.length - that.width;

    if (!that.data.in_offset(pixelIndex)) {
      if (pixelIndex > that.width && pixelIndex < upperLimit) {
        that.frameOffset = pixelIndex - Math.round(that.width / 2);
      } else if (pixelIndex >= upperLimit) {
        that.frameOffset = upperLimit;
      } else {
        that.frameOffset = 0;
      }
    }

    that.syncPlayhead(pixelIndex);
    that.updateZoomWaveform(that.frameOffset);
  };

  return WaveformZoomView;
});
