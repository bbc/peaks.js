/**
 * WAVEFORM.OVERVIEW.JS
 *
 * This module handles all functionality related to the overview
 * timeline canvas and initialises its own instance of the axis
 * object.
 *
 */
define([
  'peaks/waveform/waveform.axis',
  'peaks/waveform/waveform.mixins',
  'konva'
], function(WaveformAxis, mixins, Konva) {
  'use strict';

  function WaveformOverview(waveformData, container, peaks) {
    var self = this;

    self.peaks = peaks;
    self.options = peaks.options;
    self.data = waveformData;
    self.width = container.clientWidth;
    self.height = container.clientHeight || self.options.height;
    self.frameOffset = 0;

    self.stage = new Konva.Stage({
      container: container,
      width: self.width,
      height: self.height
    });

    self.backgroundLayer = new Konva.Layer();
    self.waveformLayer = new Konva.FastLayer();

    self.background = new Konva.Rect({
      x: 0,
      y: 0,
      width: self.width,
      height: self.height
    });

    self.backgroundLayer.add(self.background);
    self.stage.add(self.backgroundLayer);

    self.createWaveform();
    self.createRefWaveform();
    self.createUi();

    // INTERACTION ===============================================

    function cancelSeeking() {
      self.stage.off('mousemove mouseup');
      peaks.seeking = false;
    }

    self.stage.on('mousedown', function(event) {
      if (event.target &&
        !event.target.attrs.draggable &&
        !event.target.parent.attrs.draggable) {
        if (event.type === 'mousedown') {
          peaks.seeking = true;

          peaks.emit('user_seek.overview', self.data.time(event.evt.layerX), event.evt.layerX);

          self.stage.on('mousemove', function(event) {
            peaks.emit('user_scrub.overview', self.data.time(event.evt.layerX), event.evt.layerX);
          });

          self.stage.on('mouseup', cancelSeeking);
        }
        else {
          cancelSeeking();
        }
      }
    });

    // EVENTS ====================================================

    function trackPlayheadPosition(time, frame) {
      if (!peaks.seeking) {
        self.playheadPixel = self.data.at_time(time);
        self.updateUi(self.playheadPixel);
      }
    }

    peaks.on('player_time_update', trackPlayheadPosition);
    peaks.on('user_seek.*', trackPlayheadPosition);
    peaks.on('user_scrub.*', trackPlayheadPosition);

    peaks.on('waveform_zoom_displaying', function(start, end) {
      self.updateRefWaveform(start, end);
    });

    peaks.on('resizeEndOverview', function(width, newWaveformData) {
      self.width = width;
      self.data = newWaveformData;
      self.stage.setWidth(self.width);
      // self.updateWaveform();
      peaks.emit('overview_resized');
    });
  }

  WaveformOverview.prototype.createWaveform = function() {
    this.waveformShape = new Konva.Shape({
      fill: this.options.overviewWaveformColor,
      strokeWidth: 0
    });

    this.waveformShape.sceneFunc(mixins.waveformDrawFunction.bind(this.waveformShape, this));

    this.waveformLayer.add(this.waveformShape);
    this.stage.add(this.waveformLayer);
  };

  // Green Reference Waveform to inform users where they are in overview
  // waveform based on current zoom level

  WaveformOverview.prototype.createRefWaveform = function() {
    this.refLayer = new Konva.Layer();

    /*
    this.refWaveformShape = new Konva.Shape({
      drawFunc: function(canvas) {
        mixins.waveformDrawFunction.call(
          this,
          this.data,
          canvas,
          mixins.interpolateHeight(this.height)
        );
      },
      fill: this.options.zoomWaveformColor,
      strokeWidth: 0
    });
    */

    this.refWaveformRect = new Konva.Rect({
      x: 0,
      y: 11,
      width: 0,
      stroke: this.options.overviewHighlightRectangleColor,
      strokeWidth: 1,
      height: this.height - (11 * 2),
      fill: this.options.overviewHighlightRectangleColor,
      opacity: 0.3,
      cornerRadius: 2
    });

    this.refLayer.add(this.refWaveformRect);
    this.stage.add(this.refLayer);
  };

  WaveformOverview.prototype.createUi = function() {
    this.playheadLine = new Konva.Line({
      points: [0.5, 0, 0.5, this.height],
      stroke: this.options.playheadColor,
      strokeWidth: 1,
      x: 0
    });

    this.uiLayer = new Konva.Layer({ index: 100 });
    this.axis = new WaveformAxis(this);

    this.uiLayer.add(this.playheadLine);
    this.stage.add(this.uiLayer);
    this.uiLayer.moveToTop();
  };

  /*
  WaveformOverview.prototype.updateWaveform = function() {
    var self = this;
    self.waveformShape.sceneFunc(function(canvas) {
      mixins.waveformDrawFunction.call(
        this,
        self.data,
        canvas,
        mixins.interpolateHeight(self.height)
      );
    });
    self.waveformLayer.draw();
  };

  WaveformOverview.prototype.updateRefWaveform = function (time_in, time_out) {
    var self = this;

    var offset_in = self.data.at_time(time_in);
    var offset_out = self.data.at_time(time_out);

    self.refWaveformShape.sceneFunc(function(canvas) {
      self.data.set_segment(offset_in, offset_out, "zoom");

      mixins.waveformOffsetDrawFunction.call(
        this,
        self.data,
        canvas,
        mixins.interpolateHeight(self.height));
    });

    self.refWaveformShape.setWidth(self.data.at_time(time_out) - self.data.at_time(time_in));
    self.refLayer.draw();
  };
  */

  WaveformOverview.prototype.updateRefWaveform = function(timeIn, timeOut) {
    if (isNaN(timeIn)) {
      throw new Error('WaveformOverview#updateRefWaveform timeIn parameter is not a number: ' + timeIn);
    }

    if (isNaN(timeOut)) {
      throw new Error('WaveformOverview#updateRefWaveform timeOut parameter is not a number: ' + timeOut);
    }

    var offsetIn = this.data.at_time(timeIn);
    var offsetOut = this.data.at_time(timeOut);

    this.data.set_segment(offsetIn, offsetOut, 'zoom');

    this.refWaveformRect.setAttrs({
      x: this.data.segments.zoom.offset_start - this.data.offset_start,
      width: this.data.at_time(timeOut) - this.data.at_time(timeIn)
    });

    this.refLayer.draw();
  };

  WaveformOverview.prototype.updateUi = function(pixel) {
    if (isNaN(pixel)) {
      throw new Error('WaveformOverview#updateUi passed a value that is not a number: ' + pixel);
    }

    this.playheadLine.setAttr('x', pixel);
    this.uiLayer.draw();
  };

  WaveformOverview.prototype.destroy = function() {
    this.stage.destroy();
    this.stage = null;
  };

  return WaveformOverview;
});
