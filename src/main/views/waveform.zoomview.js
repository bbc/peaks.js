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

    that.ticking = false;
    that.cur_scale = 0;

    that.frameData = [];
    that.runAnimation = true;

    that.peaks = peaks;
    that.options = peaks.options;
    that.rootData = waveformData;

    that.playing = false;
    that.seeking = false;

    that.scale = 1;

    that.current_sample_rate = that.options.zoomLevels[peaks.zoom.getZoom()];

    that.data = that.rootData.resample({
      scale: that.options.zoomLevels[peaks.zoom.getZoom()]
    });

    that.playheadPixel = that.data.at_time(that.options.mediaElement.currentTime);
    that.pixelLength = that.data.adapter.length;
    that.frameOffset = 0; // the pixel offset of the current frame being displayed

    that.container = container;
    that.width = that.container.clientWidth;
    that.height = that.options.height;

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

    that.peaks.on("zoom.update", function (current_zoom_level, previous_zoom_level) {
      if (that.playing) {
        return;
      }

      if (current_zoom_level !== previous_zoom_level) {
        that.data = that.rootData.resample({
          scale: that.options.zoomLevels[current_zoom_level]
        });

        that.startZoomAnimation(current_zoom_level, previous_zoom_level);
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

  WaveformZoomView.prototype.update = function() {
    var that = this;
    var time = that.peaks.time;

    //Hide Axis
    //that.axis.axisShape.setAttr('opacity', 0);
    //Hide Segments
    if (that.segmentLayer) {
      that.segmentLayer.setVisible(false);
    }

    //Partial resampling
    var oldPixelIndex = (time.getCurrentTime() * that.rootData.adapter.sample_rate) / that.old_sample_rate;
    var input_index = oldPixelIndex - (that.width/2);
    var newPixelIndex = (time.getCurrentTime() * that.rootData.adapter.sample_rate) / that.cur_scale; //sample rate = 44100
    var output_index = newPixelIndex - (that.width/2);

    that.data = that.rootData.resample({
      scale: that.current_sample_rate,
      input_index: Math.floor(input_index),
      output_index: Math.floor(output_index),
      length: that.width
    });

    //Draw waveform
    that.zoomWaveformShape.setDrawFunc(function(canvas) {
      mixins.waveformDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
    });
    that.zoomWaveformLayer.draw();
    that.ticking = false;
    //Update the refwaveform on the overview container
    that.peaks.emit("waveform_zoom_displaying", output_index * that.data.seconds_per_pixel, (output_index+that.width) * that.data.seconds_per_pixel);
  };

  WaveformZoomView.prototype.requestWaveform = function() {
    var that = this;
    if(!that.ticking) {
      requestAnimationFrame(that.update.bind(that));
      that.ticking = true;
    }
  };

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

    var display = (that.playheadPixel >= pixelOffset) && (that.playheadPixel <= pixelOffset + that.width); //i.e. playhead is within the zoom frame width

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
    that.peaks.emit("waveform_zoom_displaying_finished", pixelOffset * that.data.seconds_per_pixel, (pixelOffset+that.width) * that.data.seconds_per_pixel);
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
      var remPixels = that.playheadPixel - that.frameOffset; //places playhead at centre of zoom frame i.e. remPixels = 500
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

  WaveformZoomView.prototype.startZoomAnimation = function (current_zoom_level, previous_zoom_level) {
    var that = this;
    var currentTime = that.peaks.time.getCurrentTime();
    var currentSampleRate = that.peaks.options.zoomLevels[current_zoom_level];
    var previousSampleRate = that.peaks.options.zoomLevels[previous_zoom_level];
    var numOfFrames = 30;

    //Fade out the time axis and the segments
    //that.axis.axisShape.setAttr('opacity', 0);
    //Fade out segments
    if (that.segmentLayer) {
      that.segmentLayer.setVisible(false);
    }

    // Determine whether zooming in or out
    if (previous_zoom_level < current_zoom_level) {
      numOfFrames = 15;
    }

    // Create array with resampled data for each animation frame (need to know duration, resample points per frame)
    for (var i = 0; i < numOfFrames; i++) {
      // Work out interpolated resample scale using current_zoom_level and previous_zoom_level
      var frame_sample_rate = Math.round(previousSampleRate + ((i + 1) * (currentSampleRate - previousSampleRate) / numOfFrames));
      //Determine the timeframe for the zoom animation (start and end of dataset for zooming animation)

      //This way calculates the index of the start time at the scale we are coming from and the scale we are going to
      var oldPixelIndex = (currentTime * that.rootData.adapter.sample_rate) / previousSampleRate;
      var input_index = oldPixelIndex - (that.width / 2);
      var newPixelIndex = (currentTime * that.rootData.adapter.sample_rate) / frame_sample_rate; //sample rate = 44100
      var output_index = newPixelIndex - (that.width / 2);

      var resampled = that.rootData.resample({ // rootData should be swapped for your resampled dataset
        scale:        frame_sample_rate,
        input_index:  Math.floor(input_index),
        output_index: Math.floor(output_index),
        width:        that.width
      });

      that.frameData.push(resampled);

      previousSampleRate = frame_sample_rate;
    }

    that.requestStart();
  };

  WaveformZoomView.prototype.requestStart = function() {
    if (this.runAnimation) {
      this.runAnimation = true;
      this.updateAnimationWaveform();
    }
  };

  WaveformZoomView.prototype.updateAnimationWaveform = function () {
    var that = this;

    if (that.frameData.length > 0) {

      var intermediate_data = that.frameData.shift();

      //Send correct resampled waveform data object to drawFunc and draw it
      that.zoomWaveformShape.setDrawFunc(function(canvas) {
        mixins.waveformDrawFunction.call(this, intermediate_data, canvas, mixins.interpolateHeight(that.height));
      });

      that.zoomWaveformLayer.draw();
      //Update the refwaveform on the overview container
      //bootstrap.pubsub.emit("waveform_zoom_displaying", output_index * that.data.seconds_per_pixel, (output_index+that.width) * that.data.seconds_per_pixel);
      requestAnimationFrame( function () {
        that.updateAnimationWaveform();
      });
    }
    else {
      //Once all intermediate frames have been drawn
      that.runAnimation = false;
      //Fade in the segments
      that.setLayerVisibility(true);
      that.seekFrame(that.data.at_time(that.currentTime));
      that.requestStart();
    }
  };

  return WaveformZoomView;
});
