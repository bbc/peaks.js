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
   * @param {WaveformOverview|WaveformZoomView} view
   * @param {Boolean} showTime If <code>true</code> The playback time position
   *   is shown next to the playhead.
   * @param {Number} time Initial position of the playhead, in seconds.
   */

  function PlayheadLayer(peaks, view, showTime, time) {
    this._peaks = peaks;
    this._view  = view;
    this._playheadPixel = 0;
    this._playheadLineAnimation = null;
    this._playheadVisible = false;

    this._playheadLayer = new Konva.Layer();

    this._createPlayhead(showTime, peaks.options.playheadColor, peaks.options.playheadTextColor);

    this.zoomLevelChanged();
    this._syncPlayhead(time);
  }

  /**
   * Adds the layer to the given {Konva.Stage}.
   *
   * @param {Konva.Stage} stage
   */

  PlayheadLayer.prototype.addToStage = function(stage) {
    stage.add(this._playheadLayer);
  };

  /**
   * Decides whether to use an animation to update the playhead position.
   *
   * If the zoom level is such that the number of pixels per second of audio is
   * low, we can use timeupdate events from the HTMLMediaElement to
   * set the playhead position. Otherwise, we use an animation to update the
   * playhead position more smoothly. The animation is CPU intensive, so we
   * avoid using it where possible.
   */

  PlayheadLayer.prototype.zoomLevelChanged = function() {
    var pixelsPerSecond = this._view.timeToPixels(1.0);
    var time;

    this._useAnimation = pixelsPerSecond >= 5;

    if (this._useAnimation) {
      if (this._peaks.player.isPlaying() && !this._playheadLineAnimation) {
        // Start the animation
        this._start();
      }
    }
    else {
      if (this._playheadLineAnimation) {
        // Stop the animation
        time = this._peaks.player.getCurrentTime();

        this.stop(time);
      }
    }
  };

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
    this._playheadLine = new Konva.Line({
      points: [0.5, 0, 0.5, this._view.getHeight()],
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
  };

  /**
   * Updates the playhead position.
   *
   * @param {Number} time Current playhead position, in seconds.
   */

  PlayheadLayer.prototype.updatePlayheadTime = function(time) {
    this._syncPlayhead(time);

    if (this._peaks.player.isPlaying()) {
      this._start();
    }
  };

  /**
   * Updates the playhead position.
   *
   * @private
   * @param {Number} time Current playhead position, in seconds.
   */

  PlayheadLayer.prototype._syncPlayhead = function(time) {
    var pixelIndex = this._view.timeToPixels(time);

    var frameOffset = this._view.getFrameOffset();
    var width = this._view.getWidth();

    var isVisible = (pixelIndex >= frameOffset) &&
                    (pixelIndex <  frameOffset + width);

    this._playheadPixel = pixelIndex;

    if (isVisible) {
      var playheadX = this._playheadPixel - frameOffset;

      if (!this._playheadVisible) {
        this._playheadVisible = true;
        this._playheadGroup.show();
      }

      this._playheadGroup.setAttr('x', playheadX);

      if (this._playheadText) {
        var text = Utils.formatTime(time, false);

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

  /**
   * Starts a playhead animation in sync with the media playback.
   *
   * @private
   */

  PlayheadLayer.prototype._start = function() {
    var self = this;

    if (self._playheadLineAnimation) {
      self._playheadLineAnimation.stop();
      self._playheadLineAnimation = null;
    }

    if (!self._useAnimation) {
      return;
    }

    var lastPlayheadPosition = null;

    self._playheadLineAnimation = new Konva.Animation(function() {
      var time = self._peaks.player.getCurrentTime();
      var playheadPosition = self._view.timeToPixels(time);

      if (playheadPosition !== lastPlayheadPosition) {
        self._syncPlayhead(time);
        lastPlayheadPosition = playheadPosition;
      }
    }, self._playheadLayer);

    self._playheadLineAnimation.start();
  };

  PlayheadLayer.prototype.stop = function(time) {
    if (this._playheadLineAnimation) {
      this._playheadLineAnimation.stop();
      this._playheadLineAnimation = null;
    }

    this._syncPlayhead(time);
  };

  /**
   * Returns the position of the playhead marker, in pixels relative to the
   * left hand side of the waveform view.
   *
   * @return {Number}
   */

  PlayheadLayer.prototype.getPlayheadOffset = function() {
    return this._playheadPixel - this._view.getFrameOffset();
  };

  PlayheadLayer.prototype.getPlayheadPixel = function() {
    return this._playheadPixel;
  };

  return PlayheadLayer;
});
