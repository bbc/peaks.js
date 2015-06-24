/**
 * WAVEFORM.OVERVIEW.JS
 *
 * This module handles all functionality related to the overview
 * timeline canvas and initialises its own instance of the axis
 * object.
 *
 */
define([
  "peaks/waveform/waveform.axis",
  "peaks/waveform/waveform.mixins",
  "Kinetic"
  ], function (WaveformAxis, mixins, Kinetic) {
  'use strict';

  function WaveformOverview(waveformData, container, peaks) {
    var that = this;

    that.peaks = peaks;
    that.options = peaks.options;
    that.data = waveformData;
    that.width = container.clientWidth;
    that.height = container.clientHeight || that.options.height;
    that.frameOffset = 0;

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

    that.createWaveform();
    that.createRefWaveform();
    that.createUi();

    that.stage.add(that.waveformLayer);

    // INTERACTION ===============================================
    var cancelSeeking = function(){
      that.stage.off("mousemove mouseup");
      peaks.seeking = false;
    };

    that.stage.on("mousedown", function (event) {
      if (event.target &&
        !event.target.attrs.draggable &&
        !event.target.parent.attrs.draggable) {
        if (event.type == "mousedown") {
          peaks.seeking = true;

          peaks.emit("user_seek.overview", that.data.time(event.evt.layerX), event.evt.layerX);

          that.stage.on("mousemove", function (event) {
            peaks.emit("user_scrub.overview", that.data.time(event.evt.layerX), event.evt.layerX);
          });

          that.stage.on("mouseup", cancelSeeking);
        } else {
          cancelSeeking();
        }
      }
    });

    // EVENTS ====================================================

    function trackPlayheadPosition(time, frame){
      if (!peaks.seaking) {
        that.playheadPixel = that.data.at_time(time);
        that.updateUi(that.playheadPixel);
      }
    }

    peaks.on("player_time_update", trackPlayheadPosition);
    peaks.on("user_seek.*", trackPlayheadPosition);
    peaks.on("user_scrub.*", trackPlayheadPosition);

    peaks.on("waveform_zoom_displaying", function (start, end) {
      that.updateRefWaveform(start, end);
    });

    peaks.on("resizeEndOverview", function (width, newWaveformData) {
      that.width = width;
      that.data = newWaveformData;
      that.stage.setWidth(that.width);
      //that.updateWaveform();
      peaks.emit("overview_resized");
    });
  }

  WaveformOverview.prototype.createWaveform = function() {
    var that = this;
    this.waveformShape = new Kinetic.Shape({
      fill: that.options.overviewWaveformColor,
      strokeWidth: 0
    });

    this.waveformShape.setDrawFunc(mixins.waveformDrawFunction.bind(this.waveformShape, that));

    this.waveformLayer.add(this.waveformShape);
    this.stage.add(this.waveformLayer);
  };

  //Green Reference Waveform to inform users where they are in overview waveform based on current zoom level
  WaveformOverview.prototype.createRefWaveform = function () {
    var that = this;

    this.refLayer = new Kinetic.Layer();

    /*this.refWaveformShape = new Kinetic.Shape({
      drawFunc: function(canvas) {
        mixins.waveformDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
      },
      fill: that.options.zoomWaveformColor,
      strokeWidth: 0
    });*/

    this.refWaveformRect = new Kinetic.Rect({
      x: 0,
      y: 11,
      width: 0,
      stroke: "grey",
      strokeWidth: 1,
      height: this.height - (11*2),
      fill: 'grey',
      opacity: 0.3,
      cornerRadius: 2
    });

    this.refLayer.add(this.refWaveformRect);
    this.stage.add(this.refLayer);
  };

  WaveformOverview.prototype.createUi = function() {
    var that = this;

    this.playheadLine = new Kinetic.Line({
      points: [0.5, 0, 0.5, that.height],
      stroke: that.options.playheadColor,
      strokeWidth: 1,
      x: 0
    });

    that.uiLayer = new Kinetic.Layer({ index: 100 });
    that.axis = new WaveformAxis(that);

    this.uiLayer.add(this.playheadLine);
    this.stage.add(this.uiLayer);
  };

  /*WaveformOverview.prototype.updateWaveform = function () {
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
  };*/

  WaveformOverview.prototype.updateRefWaveform = function (time_in, time_out) {
    if (isNaN(time_in))  throw new Error("WaveformOverview#updateRefWaveform passed a time in that is not a number: " + time_in);
    if (isNaN(time_out)) throw new Error("WaveformOverview#updateRefWaveform passed a time out that is not a number: " + time_out);

    var that = this;

    var offset_in = that.data.at_time(time_in);
    var offset_out = that.data.at_time(time_out);

    that.data.set_segment(offset_in, offset_out, "zoom");

    that.refWaveformRect.setAttrs({
      x: that.data.segments.zoom.offset_start - that.data.offset_start,
      width: that.data.at_time(time_out) - that.data.at_time(time_in)
    });

    that.refLayer.draw();
  };

  WaveformOverview.prototype.updateUi = function (pixel) {
    if (isNaN(pixel)) throw new Error("WaveformOverview#updateUi passed a value that is not a number: " + pixel);

    var that = this;

    that.playheadLine.setAttr("x", pixel);
    that.uiLayer.draw();
  };

  return WaveformOverview;
});
