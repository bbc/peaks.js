/**
 * @file
 *
 * Defines the {@link PlayheadLayer} class.
 *
 * @module peaks/views/playhead-layer
 */

define([
  'peaks/waveform/waveform.utils',
  'konva'
  ], function(Utils, Konva) {
  'use strict';

  /**
   * Creates a Konva.Layer that displays a playhead marker.
   *
   * @class
   * @alias PlayheadLayer
   *
   * @param {Peaks} peaks
   * @param {Konva.Stage} stage
   * @param {WaveformOverview|WaveformZoomView} view
   * @param {Boolean} showTime If <code>true</code> The playback time position
   *   is shown next to the playhead.
   * @param {Number} playheadPixel Initial position of the playhead, in pixels.
   */

  function PlayheadLayer(peaks, stage, view, showTime, playheadPixel) {
    this._peaks = peaks;
    this._stage = stage;
    this._view  = view;
    this._playheadPixel = 0;
    this._playheadVisible = false;

    this._createPlayhead(showTime, peaks.options.playheadColor, peaks.options.playheadTextColor);

    this.syncPlayhead(playheadPixel);
  }

  /**
   * Creates the playhead UI objects.
   *
   * @private
   * @param {Boolean} showTime If <code>true</code> The playback time position
   *   is shown next to the playhead.
   * @param {String} playheadColor
   * @param {String} playheadTextColor If <code>showTime</code> is
   *   <code>true</code>, the color of the playback time position.
   */

  PlayheadLayer.prototype._createPlayhead = function(showTime, playheadColor, playheadTextColor) {
    this._playheadLayer = new Konva.Layer();

    this._playheadLine = new Konva.Line({
      points: [0.5, 0, 0.5, this._view.height],
      stroke: playheadColor,
      strokeWidth: 1
    });

    if (showTime) {
      this._playheadText = new Konva.Text({
        x: 2,
        y: 12,
        text: '00:00:00',
        fontSize: 11,
        fontFamily: 'sans-serif',
        fill: playheadTextColor,
        align: 'right'
      });
    }

    this._playheadGroup = new Konva.Group({
      x: 0,
      y: 0
    });

    this._playheadGroup.add(this._playheadLine);

    if (showTime) {
      this._playheadGroup.add(this._playheadText);
    }

    this._playheadLayer.add(this._playheadGroup);
    this._stage.add(this._playheadLayer);
  };

  /**
   * Updates the playhead position.
   *
   * @param {Number} pixelIndex Current playhead position, in pixels.
   */

  PlayheadLayer.prototype.syncPlayhead = function(pixelIndex) {
    var isVisible = (pixelIndex >= this._view.frameOffset) &&
                    (pixelIndex <  this._view.frameOffset + this._view.width);

    this._playheadPixel = pixelIndex;

    if (isVisible) {
      var playheadX = this._playheadPixel - this._view.frameOffset;

      if (!this._playheadVisible) {
        this._playheadVisible = true;
        this._playheadGroup.show();
      }

      this._playheadGroup.setAttr('x', playheadX);

      if (this._playheadText) {
        var text = Utils.formatTime(this._view.pixelsToTime(this._playheadPixel), false);

        this._playheadText.setText(text);
      }

      this._playheadLayer.draw();
    }
    else {
      if (this._playheadVisible) {
        this._playheadVisible = false;
        this._playheadGroup.hide();

        this._playheadLayer.draw();
      }
    }
  };

  PlayheadLayer.prototype.getPlayheadOffset = function() {
    return this._playheadPixel - this._view.frameOffset;
  };

  PlayheadLayer.prototype.getPlayheadPixel = function() {
    return this._playheadPixel;
  };

  return PlayheadLayer;
});
