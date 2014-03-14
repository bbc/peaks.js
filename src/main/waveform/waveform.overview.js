define([
  "peaks/waveform/waveform.axis",
  "peaks/waveform/waveform.mixins"
  ], function (WaveformAxis, mixins) {
  'use strict';

  function WaveformOverview(waveformData, container, peaks) {
    var that = this;

    that.options = peaks.options;
    that.data = waveformData;
    that.container = container;
    that.width = that.container.clientWidth;
    that.height = that.options.height;
    that.frameOffset = 0;
    that.seeking = false;

    that.stage = new Kinetic.Stage({
      container: container,
      width: that.width,
      height: that.height
    });

    that.waveformLayer = new Kinetic.Layer();

    that.background = new Kinetic.Rect({
      x: 0,
      y: 0,
      width: that.width,
      height: that.height
    });

    that.waveformLayer.add(that.background);

    that.uiLayer = new Kinetic.Layer();
    that.refLayer = new Kinetic.Layer();

    that.axis = new WaveformAxis(that);

    that.createWaveform();
    that.createRefWaveform();
    that.axis.drawAxis(0);
    that.createUi();

    // INTERACTION ===============================================
    var cancelSeeking = function(){
      that.stage.off("mousemove mouseup");
      that.seeking = false;
    };

    that.stage.on("mousedown", function (event) {
      if (event.targetNode &&
        !event.targetNode.attrs.draggable &&
        !event.targetNode.parent.attrs.draggable) {
        if (event.type == "mousedown") {
          that.seeking = true;

          var width = that.refWaveformShape.getWidth();

          that.updateRefWaveform(
            that.data.time(event.layerX),
            that.data.time(event.layerX + width)
          );

          peaks.emit("overview_user_seek", that.data.time(event.layerX), event.layerX);

          that.stage.on("mousemove", function (event) {
            that.updateRefWaveform(
              that.data.time(event.layerX),
              that.data.time(event.layerX + width)
            );

            peaks.emit("overview_user_seek", that.data.time(event.layerX), event.layerX);
          });

          that.stage.on("mouseup", cancelSeeking);
        } else {
          cancelSeeking();
        }
      }
    });

    // EVENTS ====================================================

    peaks.on("player_time_update", function (time) {
      if (!that.seeking) {
        that.playheadPixel = that.data.at_time(time);
        that.updateUi(that.playheadPixel);
      }
    });

    peaks.on("overview_user_seek", function (time, frame) {
      that.playheadPixel = frame;
      that.updateUi(that.playheadPixel);

      that.options.mediaElement.currentTime = time;
    });

    peaks.on("waveform_zoom_displaying", function (start, end) {
      that.updateRefWaveform(start, end);
    });

    peaks.on("resizeEndOverview", function (width, newWaveformData) {
      that.width = width;
      that.data = newWaveformData;
      that.stage.setWidth(that.width);
      that.updateWaveform();
      peaks.emit("overview_resized");
    });
  }

  WaveformOverview.prototype.createWaveform = function() {
    var that = this;
    this.waveformShape = new Kinetic.Shape({
      drawFunc: function(canvas) {
        mixins.waveformDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
      },
      fill: that.options.overviewWaveformColor,
      strokeWidth: 0
    });
    this.waveformLayer.add(this.waveformShape);
    this.stage.add(this.waveformLayer);
  };

  WaveformOverview.prototype.createRefWaveform = function () {
    var that = this;

    this.refWaveformShape = new Kinetic.Shape({
      drawFunc: function(canvas) {
        mixins.waveformOffsetDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
      },
      fill: that.options.zoomWaveformColor,
      strokeWidth: 0
    });

    this.refLayer.add(this.refWaveformShape);
    this.stage.add(this.refLayer);
  };

  WaveformOverview.prototype.createUi = function() {
    var that = this;
    this.playheadLine = new Kinetic.Line({
      points: that._getPlayheadPoints(0),
      stroke: that.options.playheadColor,
      strokeWidth: 1
    });
    this.uiLayer.add(this.playheadLine);
    this.stage.add(this.uiLayer);
  };

  WaveformOverview.prototype.updateWaveform = function () {
    var that = this;
    that.waveformShape.setDrawFunc(function(canvas) {
      mixins.waveformDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
    });
    that.waveformLayer.draw();
  };

  WaveformOverview.prototype.updateWaveform = function () {
    var that = this;
    that.waveformShape.setDrawFunc(function(canvas) {
      mixins.waveformDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
    });
    that.waveformLayer.draw();
  };

  WaveformOverview.prototype.updateRefWaveform = function (time_in, time_out) {
    var that = this;

    var offset_in = that.data.at_time(time_in);
    var offset_out = that.data.at_time(time_out);

    that.refWaveformShape.setDrawFunc(function(canvas) {
      that.data.set_segment(offset_in, offset_out, "zoom");

      mixins.waveformOffsetDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
    });

    that.refWaveformShape.setWidth(that.data.at_time(time_out) - that.data.at_time(time_in));
    that.refLayer.draw();
  };

  WaveformOverview.prototype.updateUi = function (pixel) {
    var that = this;
    that.playheadLine.setAttr("points", that._getPlayheadPoints(pixel));
    that.uiLayer.draw();
  };

  WaveformOverview.prototype._getPlayheadPoints = function (pixelOffset) {
    var that = this;
    return [{x:pixelOffset+0.5, y:0},{x:pixelOffset+0.5, y:that.height}];
  };

  return WaveformOverview;
});
