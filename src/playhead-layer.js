/**
 * @file
 *
 * Defines the {@link PlayheadLayer} class.
 *
 * @module playhead-layer
 */

import { Animation } from 'konva/lib/Animation';
import { Group } from 'konva/lib/Group';
import { Layer } from 'konva/lib/Layer';
import { Line } from 'konva/lib/shapes/Line';
import { Text } from 'konva/lib/shapes/Text';

/**
 * Creates a Konva.Layer that displays a playhead marker.
 *
 * @class
 * @alias PlayheadLayer
 *
 * @param {Object} options
 * @param {Player} options.player
 * @param {WaveformOverview|WaveformZoomView} options.view
 * @param {Boolean} options.showPlayheadTime If <code>true</code> The playback time position
 *   is shown next to the playhead.
 * @param {String} options.playheadColor
 * @param {String} options.playheadTextColor
 * @param {String} options.playheadFontFamily
 * @param {Number} options.playheadFontSize
 * @param {String} options.playheadFontStyle
 */

export default class PlayheadLayer {
  constructor(options) {
    this._player = options.player;
    this._view = options.view;
    this._playheadPixel = 0;
    this._playheadLineAnimation = null;
    this._playheadVisible = false;
    this._playheadColor = options.playheadColor;
    this._playheadTextColor = options.playheadTextColor;

    this._playheadFontFamily = options.playheadFontFamily;
    this._playheadFontSize = options.playheadFontSize;
    this._playheadFontStyle = options.playheadFontStyle;

    this._playheadLayer = new Layer();

    this._createPlayhead(this._playheadColor);

    if (options.showPlayheadTime) {
      this._createPlayheadText(this._playheadTextColor);
    }

    this.fitToView();

    this.zoomLevelChanged();
  }

  /**
   * Adds the layer to the given {Konva.Stage}.
   *
   * @param {Konva.Stage} stage
   */

  addToStage(stage) {
    stage.add(this._playheadLayer);
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

  zoomLevelChanged() {
    var pixelsPerSecond = this._view.timeToPixels(1.0);
    var time;

    this._useAnimation = pixelsPerSecond >= 5;

    if (this._useAnimation) {
      if (this._player.isPlaying() && !this._playheadLineAnimation) {
        // Start the animation
        this._start();
      }
    }
    else {
      if (this._playheadLineAnimation) {
        // Stop the animation
        time = this._player.getCurrentTime();

        this.stop(time);
      }
    }
  }

  /**
   * Resizes the playhead UI objects to fit the available space in the
   * view.
   */

  fitToView() {
    var height = this._view.getHeight();

    this._playheadLine.points([0.5, 0, 0.5, height]);

    if (this._playheadText) {
      this._playheadText.y(12);
    }
  }

  /**
   * Creates the playhead UI objects.
   *
   * @private
   * @param {String} color
   */

  _createPlayhead(color) {
    // Create with default points, the real values are set in fitToView().
    this._playheadLine = new Line({
      stroke:      color,
      strokeWidth: 1
    });

    this._playheadGroup = new Group({
      x: 0,
      y: 0
    });

    this._playheadGroup.add(this._playheadLine);
    this._playheadLayer.add(this._playheadGroup);
  }

  _createPlayheadText(color) {
    var time = this._player.getCurrentTime();
    var text = this._view.formatTime(time);

    // Create with default y, the real value is set in fitToView().
    this._playheadText = new Text({
      x: 2,
      y: 0,
      text: text,
      fontSize: this._playheadFontSize,
      fontFamily: this._playheadFontFamily,
      fontStyle: this._playheadFontStyle,
      fill: color,
      align: 'right'
    });

    this._playheadGroup.add(this._playheadText);
  }

  /**
   * Updates the playhead position.
   *
   * @param {Number} time Current playhead position, in seconds.
   */

  updatePlayheadTime(time) {
    this._syncPlayhead(time);

    if (this._player.isPlaying()) {
      this._start();
    }
  }

  /**
   * Updates the playhead position.
   *
   * @private
   * @param {Number} time Current playhead position, in seconds.
   */

  _syncPlayhead(time) {
    var pixelIndex = this._view.timeToPixels(time);

    var frameOffset = this._view.getFrameOffset();
    var width = this._view.getWidth();

    var isVisible = (pixelIndex >= frameOffset) &&
                    (pixelIndex <= frameOffset + width);

    this._playheadPixel = pixelIndex;

    if (isVisible) {
      var playheadX = this._playheadPixel - frameOffset;

      if (!this._playheadVisible) {
        this._playheadVisible = true;
        this._playheadGroup.show();
      }

      this._playheadGroup.setX(playheadX);

      if (this._playheadText) {
        var text = this._view.formatTime(time);
        var playheadTextWidth = this._playheadText.getTextWidth();

        this._playheadText.setText(text);

        if (playheadTextWidth + playheadX > width - 2) {
          this._playheadText.setX(-playheadTextWidth - 2);
        }
        else if (playheadTextWidth + playheadX < width) {
          this._playheadText.setX(2);
        }
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

    if (this._view.playheadPosChanged) {
      this._view.playheadPosChanged(time);
    }
  }

  /**
   * Starts a playhead animation in sync with the media playback.
   *
   * @private
   */

  _start() {
    var self = this;

    if (self._playheadLineAnimation) {
      self._playheadLineAnimation.stop();
      self._playheadLineAnimation = null;
    }

    if (!self._useAnimation) {
      return;
    }

    var lastPlayheadPosition = null;

    self._playheadLineAnimation = new Animation(function() {
      var time = self._player.getCurrentTime();
      var playheadPosition = self._view.timeToPixels(time);

      if (playheadPosition !== lastPlayheadPosition) {
        self._syncPlayhead(time);
        lastPlayheadPosition = playheadPosition;
      }
    }, self._playheadLayer);

    self._playheadLineAnimation.start();
  }

  stop(time) {
    if (this._playheadLineAnimation) {
      this._playheadLineAnimation.stop();
      this._playheadLineAnimation = null;
    }

    this._syncPlayhead(time);
  }

  /**
   * Returns the position of the playhead marker, in pixels relative to the
   * left hand side of the waveform view.
   *
   * @return {Number}
   */

  getPlayheadOffset() {
    return this._playheadPixel - this._view.getFrameOffset();
  }

  getPlayheadPixel() {
    return this._playheadPixel;
  }

  showPlayheadTime(show) {
    var updated = false;

    if (show) {
      if (!this._playheadText) {
        // Create it
        this._createPlayheadText(this._playheadTextColor);
        this.fitToView();
        updated = true;
      }
    }
    else {
      if (this._playheadText) {
        this._playheadText.remove();
        this._playheadText.destroy();
        this._playheadText = null;
        updated = true;
      }
    }

    if (updated) {
      this._playheadLayer.draw();
    }
  }

  updatePlayheadText() {
    // Update current play head
    if (this._playheadText) {
      var time = this._player.getCurrentTime();
      var text = this._view.formatTime(time);

      this._playheadText.setText(text);
    }

    this._playheadLayer.draw();
  }

  destroy() {
    if (this._playheadLineAnimation) {
      this._playheadLineAnimation.stop();
      this._playheadLineAnimation = null;
    }
  }
}
