/**
 * @file
 *
 * Defines the {@link WaveformOverview} class.
 *
 * @module peaks/views/waveform.overview
 */
define([
  'peaks/waveform/waveform.axis',
  'peaks/waveform/waveform.mixins',
  'peaks/views/helpers/mousedraghandler',
  'konva'
], function(WaveformAxis, mixins, MouseDragHandler, Konva) {
  'use strict';

  /**
   * Creates the overview waveform view.
   *
   * @class
   * @alias WaveformOverview
   *
   * @param {WaveformData} waveformData
   * @param {HTMLElement} container
   * @param {Peaks} peaks
   */
  function WaveformOverview(waveformData, container, peaks) {
    var self = this;

    self.originalWaveformData = waveformData;
    self.container = container;
    self.peaks = peaks;

    self.options = peaks.options;
    self.width = container.clientWidth;
    self.height = container.clientHeight || self.options.height;
    self.frameOffset = 0;

    self.data = waveformData.resample(self.width);

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
    self.createHighlightRect();
    self.createUi();

    self.mouseDragHandler = new MouseDragHandler(self.stage, {
      onMouseDown: function(mousePosX) {
        self.peaks.emit('user_seek.overview', self.data.time(mousePosX));
      },

      onMouseMove: function(mousePosX) {
        if (mousePosX < 0) {
          mousePosX = 0;
        }
        else if (mousePosX > self.width) {
          mousePosX = self.width;
        }

        self.peaks.emit('user_seek.overview', self.data.time(mousePosX));
      }
    });

    // EVENTS ====================================================

    function trackPlayheadPosition(time, frame) {
      self.playheadPixel = self.data.at_time(time);
      self.updateUi(self.playheadPixel);
    }

    peaks.on('player_time_update', trackPlayheadPosition);
    // peaks.on('user_seek.zoomview', trackPlayheadPosition);
    // peaks.on('user_seek.overview', trackPlayheadPosition);

    peaks.on('zoomview.displaying', function(startTime, endTime) {
      self.updateHighlightRect(startTime, endTime);
    });

    peaks.on('window_resize', function() {
      self.container.hidden = true;
    });

    peaks.on('window_resize_complete', function(width) {
      self.width = width;
      self.data = self.originalWaveformData.resample(self.width);
      self.stage.setWidth(self.width);
      // self.updateWaveform();
      self.container.removeAttribute('hidden');
    });
  }

  WaveformOverview.prototype.createWaveform = function() {
    this.waveformShape = new Konva.Shape({
      fill: this.options.overviewWaveformColor,
      strokeWidth: 0
    });

    this.waveformShape.sceneFunc(
      mixins.waveformDrawFunction.bind(this.waveformShape, this)
    );

    this.waveformLayer.add(this.waveformShape);
    this.stage.add(this.waveformLayer);
  };

  /**
   * Creates a highlight region to show the current position of the
   * WaveformZoomView.
   */

  WaveformOverview.prototype.createHighlightRect = function() {
    this.highlightLayer = new Konva.Layer();

    this.highlightRect = new Konva.Rect({
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

    this.highlightLayer.add(this.highlightRect);
    this.stage.add(this.highlightLayer);
  };

  /**
   * Updates the position of the highlight region.
   *
   * @param {Number} startTime
   * @param {Number} endTime
   */

  WaveformOverview.prototype.updateHighlightRect = function(startTime, endTime) {
    var startOffset = this.data.at_time(startTime);
    var endOffset   = this.data.at_time(endTime);

    this.highlightRect.setAttrs({
      x:     startOffset,
      width: endOffset - startOffset
    });

    this.highlightLayer.draw();
  };

  WaveformOverview.prototype.createUi = function() {
    this.playheadLine = new Konva.Line({
      points: [0.5, 0, 0.5, this.height],
      stroke: this.options.playheadColor,
      strokeWidth: 1,
      x: 0
    });

    this.uiLayer = new Konva.Layer({ index: 100 });
    this.axis = new WaveformAxis(this, this.uiLayer);

    this.uiLayer.add(this.playheadLine);
    this.stage.add(this.uiLayer);
    this.uiLayer.moveToTop();
  };

  // WaveformZoomView equivalent: updateZoomWaveform

  WaveformOverview.prototype.updateUi = function(pixel) {
    this.playheadLine.setAttr('x', pixel);
    this.uiLayer.draw();
  };

  WaveformOverview.prototype.destroy = function() {
    this.stage.destroy();
    this.stage = null;
  };

  return WaveformOverview;
});
