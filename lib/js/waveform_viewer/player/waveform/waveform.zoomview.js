/**
 * WAVEFORM.ZOOMVIEW.JS
 *
 * This module handles all functionality related to the zoomed in
 * waveform view canvas and initialises its own instance of the axis
 * object.
 *
 */
define([
  "m/bootstrap",
  "m/player/waveform/waveform.axis",
  "m/player/waveform/waveform.mixins",
  ], function (bootstrap, WaveformAxis, mixins) {

  function WaveformZoomView(waveformData, $container, options) {
    var that = this;

    that.options = options;
    that.rootData = waveformData;
    that.playing = false;
    that.seeking = false;

    that.current_zoom_level = 0;

    that.data = that.rootData.resample({
                  scale: options.zoomLevels[that.current_zoom_level]
                });

    that.pixelLength = that.data.adapter.length;
    that.pixelsPerSecond = that.data.pixels_per_second;
    that.frameOffset = 0; // the pixel offset of the current frame being displayed

    that.$container = $container;
    that.width = that.$container.width();
    that.height = options.height;

    that.stage = new Kinetic.Stage({
      container: $container[0],
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

    that.stage.on("mousedown mouseup", function (event) {
      if (event.targetNode &&
        !event.targetNode.attrs.draggable &&
        !event.targetNode.parent.attrs.draggable) {
        if (event.type == "mousedown") {
          that.seeking = true;
          var x = event.layerX, dX, p;

          // Set playhead position
          options.audioElement.currentTime = that.data.time(that.frameOffset + x);
          that.syncPlayhead(that.frameOffset + x);

          // enable drag if necessary
          that.stage.on("mousemove", function (event) {
            dX = event.layerX > x ? x - event.layerX : (x - event.layerX)*1;
            x = event.layerX;
            p = that.frameOffset+dX;
            p = p < 0 ? 0 : p > (that.pixelLength - that.width) ? (that.pixelLength - that.width) : p;
            that.updateZoomWaveform(p);
          });
          $(document).on("mouseup", function () {
            that.stage.off("mousemove");
            that.seeking = false;
          });
        } else {
          that.stage.off("mousemove");
          that.seeking = false;
        }
      }
    });

    // EVENTS ====================================================

    bootstrap.pubsub.on("player_time_update", function (time) {
      if (!that.seeking && !that.playing) {
        that.seekFrame(that.data.at_time(time));
      }
    });

    bootstrap.pubsub.on("overview_user_seek", function (time) {
      that.seekFrame(that.data.at_time(time));
    });

    bootstrap.pubsub.on("player_play", function (time) {
      that.playing = true;
      that.playFrom(time, that.data.at_time(time));
    });

    bootstrap.pubsub.on("player_pause", function (time) {
      that.playing = false;
      if (that.playheadLineAnimation) {
        that.playheadLineAnimation.stop();
      }
      that.syncPlayhead(that.data.at_time(time));
    });

    bootstrap.pubsub.on("waveform_zoom_level_changed", function (zoom_level) {
      if (that.playing) {
        return;
      }

      if (zoom_level != that.current_zoom_level) {
        that.current_zoom_level = zoom_level;
        that.data = that.rootData.resample({
          scale: zoom_level
        });
        that.pixelsPerSecond = that.data.pixels_per_second;
        that.seekFrame(that.data.at_time(options.audioElement.currentTime));
      }
    });

    bootstrap.pubsub.on("window_resized", function (width, newWaveformData) {
      that.width = width;
      that.data = newWaveformData;
      that.stage.setWidth(that.width);
      that.updateZoomWaveform(that.frameOffset);
      bootstrap.pubsub.emit("zoomview_resized");
    });

    // KEYBOARD EVENTS =========================================

    bootstrap.pubsub.on("kybrd_left", function () {
      var atTime = options.audioElement.currentTime;

      atTime -= that.options.nudgeIncrement;
      that.seekFrame(that.data.at_time(atTime));
    });

    bootstrap.pubsub.on("kybrd_right", function () {
      var atTime = options.audioElement.currentTime;

      atTime += that.options.nudgeIncrement;
      that.seekFrame(that.data.at_time(atTime));
    });

    bootstrap.pubsub.on("kybrd_shift_left", function () {
      var atTime = options.audioElement.currentTime;

      atTime -= (that.options.nudgeIncrement*10);
      that.seekFrame(that.data.at_time(atTime));
    });

    bootstrap.pubsub.on("kybrd_shift_right", function () {
      var atTime = options.audioElement.currentTime;

      atTime += (that.options.nudgeIncrement*10);
      that.seekFrame(that.data.at_time(atTime));
    });
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
    bootstrap.pubsub.emit("waveform_zoom_displaying", 0 * that.data.seconds_per_pixel, that.width * that.data.seconds_per_pixel);
  };

  WaveformZoomView.prototype.createUi = function() {
    var that = this;

    that.zoomPlayheadLine = new Kinetic.Line({
      points: [{x: 0, y: 0},{x: 0, y: that.height}],
      stroke: 'rgba(0,0,0,1)',
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

    that.frameOffset = pixelOffset;

    var display = (that.playheadPixel >= pixelOffset) && (that.playheadPixel <= pixelOffset + that.width);

    if (display) {
      var remPixels = that.playheadPixel - pixelOffset;

      that.zoomPlayheadGroup.show().setAttr("x", remPixels + 0.5);
      that.zoomPlayheadText.setText(mixins.niceTime(that.data.time(that.playheadPixel), false));
    } else {
      that.zoomPlayheadGroup.hide();
    }

    that.uiLayer.draw();

    that.zoomWaveformShape.setDrawFunc(function(canvas) {
      that.data.offset(pixelOffset, pixelOffset + that.width);

      mixins.waveformDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
    });

    that.zoomWaveformLayer.draw();

    that.axis.drawAxis(that.data.time(pixelOffset));

    // if (that.snipWaveformShape) that.updateSnipWaveform(that.currentSnipStartTime, that.currentSnipEndTime);

    bootstrap.pubsub.emit("waveform_zoom_displaying", pixelOffset * that.data.seconds_per_pixel, (pixelOffset+that.width) * that.data.seconds_per_pixel);
  };

  // UI functions ==============================

  WaveformZoomView.prototype.playFrom = function (time, startPosition) {
    var that = this;

    if (that.playheadLineAnimation) {
      that.playheadLineAnimation.stop();
    }

    startPosition = startPosition - that.frameOffset;
    var startSeconds = time;
    var frameSeconds = 0;

    that.playheadLineAnimation = new Kinetic.Animation(function (frame) {
      var time = frame.time,
          timeDiff = frame.timeDiff,
          frameRate = frame.frameRate;

      var seconds = time / 1000;
      var positionInFrame = Math.round(startPosition + (that.pixelsPerSecond * (seconds-frameSeconds)));

      that.playheadPixel = that.frameOffset + positionInFrame;

      if (positionInFrame > that.width) {
        that.newFrame();
        that.zoomPlayheadGroup.setAttr("x", 0);
        that.zoomPlayheadText.setText(mixins.niceTime(that.data.time(0), false));
        startPosition = 0;
        var s = seconds - frameSeconds;
        frameSeconds += s; // TODO: ??
      } else {
        that.zoomPlayheadGroup.setAttr("x", positionInFrame + 0.5);
        that.zoomPlayheadText.setText(mixins.niceTime(that.data.time(that.frameOffset + positionInFrame), false));
      }
    }, that.uiLayer);

    that.playheadLineAnimation.start();
  };

  WaveformZoomView.prototype.newFrame = function () {
    var that = this;
    that.frameOffset += that.width;
    that.updateZoomWaveform(that.frameOffset);
  };

  WaveformZoomView.prototype.syncPlayhead = function (pixelIndex) {
    var that = this;
    that.playheadPixel = pixelIndex;
    var display = (that.playheadPixel >= that.frameOffset) && (that.playheadPixel <= that.frameOffset + that.width);
    if (display) {
      var remPixels = that.playheadPixel - that.frameOffset;
      that.zoomPlayheadGroup.show().setAttr("x", remPixels + 0.5);
      that.zoomPlayheadText.setText(mixins.niceTime(that.data.time(that.playheadPixel), false));
    } else {
      that.zoomPlayheadGroup.hide();
    }

    that.uiLayer.draw();
  };

  WaveformZoomView.prototype.seekFrame = function (pixelIndex) {
    var that = this;
    var upperLimit = that.data.adapter.length - that.width;

    if (pixelIndex > that.width && pixelIndex < upperLimit) {
      that.frameOffset = pixelIndex - Math.round(that.width / 2);
    } else if (pixelIndex >= upperLimit) {
      that.frameOffset = upperLimit;
    } else {
      that.frameOffset = 0;
    }

    that.syncPlayhead(pixelIndex);
    that.updateZoomWaveform(that.frameOffset);
  };

  return WaveformZoomView;
});
