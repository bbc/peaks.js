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
    this._playheadLineAnimation = null;
    this._playheadVisible = false;

    this._createPlayhead(showTime, peaks.options.playheadColor, peaks.options.playheadTextColor);

    this.zoomLevelChanged();
    this.syncPlayhead(playheadPixel);
  }

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
      if (this._view.isPlaying() && !this._playheadLineAnimation) {
        // Start the animation
        time = this._peaks.player.getCurrentTime();

        this.playFrom(time);
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

  /**
   * Creates a playhead animation in sync with the media playback.
   *
   * @param {Number} startTime Start time of the playhead animation, in seconds.
   */

  PlayheadLayer.prototype.playFrom = function(startTime) {
    var self = this;

    if (self._playheadLineAnimation) {
      self._playheadLineAnimation.stop();
      self._playheadLineAnimation = null;
    }

    if (!self._useAnimation) {
      return;
    }

    var lastPlayheadPosition = null;

    self._playheadLineAnimation = new Konva.Animation(function(frame) {
      // Elapsed time since animation started (seconds).
      var elapsed = frame.time / 1000;

      var playheadPosition = self._view.timeToPixels(startTime + elapsed);

      if (playheadPosition !== lastPlayheadPosition) {
        self.syncPlayhead(playheadPosition);
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

    this.syncPlayhead(this._view.timeToPixels(time));
  };

  PlayheadLayer.prototype.getPlayheadOffset = function() {
    return this._playheadPixel - this._view.frameOffset;
  };

  PlayheadLayer.prototype.getPlayheadPixel = function() {
    return this._playheadPixel;
  };

  return PlayheadLayer;
});
