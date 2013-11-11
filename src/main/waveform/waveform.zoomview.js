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

    that.current_zoom_level = 0;
    that.current_sample_rate = that.options.zoomLevels[that.current_zoom_level];
    that.currentTime = 0;

    that.data = that.rootData.resample({
      scale: that.options.zoomLevels[that.current_zoom_level]
    });

    that.playheadPixel = that.data.at_time(that.options.mediaElement.currentTime);
    that.pixelLength = that.data.adapter.length;
    that.pixelsPerSecond = that.data.pixels_per_second;
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
        //Zoom Level
        that.oldZoomLevel = that.current_zoom_level;
        that.current_zoom_level = zoom_level;

        //Samples Per Pixel
        that.old_sample_rate = that.current_sample_rate;
        that.current_sample_rate = that.options.zoomLevels[zoom_level];

        that.data = that.rootData.resample({
          scale: that.current_sample_rate
        });

        that.pixelsPerSecond = that.data.pixels_per_second;
        that.startZoomAnimation();
        that.seekFrame(that.data.at_time(that.currentTime));
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

  WaveformZoomView.prototype.startZoomAnimation = function () {
    var that = this;
    var direction;

    //console.log("Current Sample Rate: ", that.current_sample_rate, "Old Sample Rate: ", that.old_sample_rate, "pixelIndex: ", pixelIndex, "data.length :", that.data.adapter.data.length);

    //fade out the time axis and the segments
    //that.axis.axisTween.play();
    this.axis.axisShape.setAttr('opacity', 0);
    //fade out segments
    var segmentChildren = that.segmentLayer.getChildren();
      segmentChildren.each(function(segmentChild) {
      var segmentShapes = segmentChild.getChildren();
      segmentShapes.each(function(segmentObject) {
        segmentObject.setAttr('opacity', 0);
      });
    });

    // Determine whether zooming in or out
    if (that.oldZoomLevel > that.current_zoom_level) {
      console.log("Zooming In");
      direction = "In";
    } else {
      console.log("Zooming Out");
      direction = "Out";
    }
    // Determine the timeframe for the zoom animation (start and end of dataset for zooming animation)
    //
    // Create array with resampled data for each animation frame (need to know duration, resample points per frame)
    var frameData = [];
    for (var i = 0; i < 60; i++) {
      var frame_sample_rate = Math.round(that.old_sample_rate + ((i+1)*(that.current_sample_rate - that.old_sample_rate)/60)); // Work out interpolated resample scale using that.current_zoom_level and that.oldZoomLevel and wether you are zooming in or out
      //console.log("Loop Number: ", i, "New Scale: ", frame_sample_rate);
      frameData.push(
        that.rootData.resample({ // rootData should be swapped for your resampled dataset
          scale: frame_sample_rate
        })
      );
    }

    //that.axis.axisTween.pause();

    // Start an animation that displays the data on the frame
    that.zoomAnimation = new Kinetic.Animation(function (frame) {
      if (frameData.length > 0) {
        var intermediate_data = frameData.shift();
        //that.data = intermediate_data;
        var time = frame.time,
          timeDiff = frame.timeDiff,
          frameRate = frame.frameRate;
        var seconds = time / 1000;

        //console.log("Time: ", time, "TimeDiff: ", timeDiff, "frameRate: ", frameRate, "Seconds: ", seconds);
        var upperLimit = intermediate_data.adapter.length - that.width; //what does adpater.length refer to? I assumed it was the number of data points in the resampled data
        console.log("Adpater Length", that.data.adapter.length);
        var pixelIndex = intermediate_data.at_time(that.currentTime);
        if (pixelIndex > that.width && pixelIndex < upperLimit) {
          that.frameOffset = pixelIndex - Math.round(that.width / 2);
        } else if (pixelIndex >= upperLimit) {
          that.frameOffset = upperLimit;
        } else {
          that.frameOffset = 0;
        }

        console.log("Pixel Index", pixelIndex, "Frame Offset", that.frameOffset, "Upper Limit", upperLimit);
        // Send correct data from frameData to drawFunc for waveform and draw it
        that.zoomWaveformShape.setDrawFunc(function(canvas) {
          intermediate_data.offset(that.frameOffset, that.frameOffset + that.width);

          mixins.waveformDrawFunction.call(this, intermediate_data, canvas, mixins.interpolateHeight(that.height));
        });

        that.zoomWaveformLayer.draw();

        //need to syncplayhead?

        //display the time axis
        //that.axis.drawAxis(that.data.time(that.frameOffset));

        //that.peaks.emit("waveform_zoom_displaying");

      }
      else {
        that.zoomAnimation.stop();
        //fade in the segments
        segmentChildren.each(function(segmentChild) {
          var segmentShapes = segmentChild.getChildren();
          segmentShapes.each(function(segmentObject) {
            new Kinetic.Tween({
              node: segmentObject,
              duration: 1.5,
              opacity: 1
            }).play();
          });
        });
        //fade in axis
        that.axis.axisTween.play();
        //that.axis.axisTween.reverse();
      }
    }, that.uiLayer);

    that.zoomAnimation.start();
  };

  return WaveformZoomView;
});
