/**
 * @file
 *
 * Defines the {@link PlayheadLayer} class.
 *
 * @module playhead-layer
 */

import Konva from 'konva/lib/Core';
import { Animation } from 'konva/lib/Animation';
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
 * @param {String} options.playheadBackgroundColor
 * @param {Number} options.playheadPadding
 * @param {String} options.playheadFontFamily
 * @param {Number} options.playheadFontSize
 * @param {String} options.playheadFontStyle
 */

function PlayheadLayer(options) {
  this._player = options.player;
  this._view = options.view;
  this._playheadPixel = 0;
  this._playheadLineAnimation = null;
  this._playheadVisible = false;
  this._playheadColor = options.playheadColor;
  this._playheadTextColor = options.playheadTextColor;
  this._playheadBackgroundColor = options.playheadBackgroundColor;
  this._playheadPadding = options.playheadPadding;

  this._playheadFontFamily = options.playheadFontFamily;
  this._playheadFontSize = options.playheadFontSize;
  this._playheadFontStyle = options.playheadFontStyle;

  this._playheadLayer = new Konva.Layer();

  this._createPlayhead();

  if (options.showPlayheadTime) {
    this._createPlayheadText();
  }

  this.fitToView();

  this.zoomLevelChanged();
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
  const pixelsPerSecond = this._view.timeToPixels(1.0);

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
      const time = this._player.getCurrentTime();

      this.stop(time);
    }
  }
};

/**
 * Resizes the playhead UI objects to fit the available space in the
 * view.
 */

PlayheadLayer.prototype.fitToView = function() {
  const height = this._view.getHeight();

  this._playheadLine.points([0.5, 0, 0.5, height]);

  if (this._playheadText) {
    this._playheadText.y(12);
  }
};

/**
 * Creates the playhead UI objects.
 *
 * @private
 * @param {String} color
 */

PlayheadLayer.prototype._createPlayhead = function() {
  // Create with default points, the real values are set in fitToView().
  this._playheadLine = new Line({
    stroke:      this._playheadColor,
    strokeWidth: 1
  });

  this._playheadGroup = new Konva.Group({
    x: 0,
    y: 0
  });

  this._playheadGroup.add(this._playheadLine);
  this._playheadLayer.add(this._playheadGroup);
};

PlayheadLayer.prototype._createPlayheadText = function() {
  const self = this;

  const time = self._player.getCurrentTime();
  const text = self._view.formatTime(time);

  // Create with default y, the real value is set in fitToView().
  self._playheadText = new Text({
    x: 0,
    y: 0,
    padding: self._playheadPadding,
    text: text,
    fontSize: self._playheadFontSize,
    fontFamily: self._playheadFontFamily,
    fontStyle: self._playheadFontStyle,
    fill: self._playheadTextColor,
    align: 'right',
    sceneFunc: function(context, shape) {
      const width = shape.width();
      const height = shape.height() + 2 * self._playheadPadding;

      context.fillStyle = self._playheadBackgroundColor;
      context.fillRect(0, -self._playheadPadding, width, height);
      shape._sceneFunc(context);
    }
  });

  self._playheadGroup.add(self._playheadText);
};

/**
 * Updates the playhead position.
 *
 * @param {Number} time Current playhead position, in seconds.
 */

PlayheadLayer.prototype.updatePlayheadTime = function(time) {
  this._syncPlayhead(time);

  if (this._player.isPlaying()) {
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
  const pixelIndex = this._view.timeToPixels(time);

  const frameOffset = this._view.getFrameOffset();
  const width = this._view.getWidth();

  const isVisible = (pixelIndex >= frameOffset) &&
                    (pixelIndex <= frameOffset + width);

  this._playheadPixel = pixelIndex;

  if (isVisible) {
    const playheadX = this._playheadPixel - frameOffset;

    if (!this._playheadVisible) {
      this._playheadVisible = true;
      this._playheadGroup.show();
    }

    this._playheadGroup.setX(playheadX);

    if (this._playheadText) {
      const text = this._view.formatTime(time);
      const playheadTextWidth = this._playheadText.width();

      this._playheadText.setText(text);

      if (playheadTextWidth + playheadX > width - 2) {
        this._playheadText.setX(-playheadTextWidth);
      }
      else if (playheadTextWidth + playheadX < width) {
        this._playheadText.setX(0);
      }
    }
  }
  else {
    if (this._playheadVisible) {
      this._playheadVisible = false;
      this._playheadGroup.hide();
    }
  }

  if (this._view.playheadPosChanged) {
    this._view.playheadPosChanged(time);
  }
};

/**
 * Starts a playhead animation in sync with the media playback.
 *
 * @private
 */

PlayheadLayer.prototype._start = function() {
  const self = this;

  if (self._playheadLineAnimation) {
    self._playheadLineAnimation.stop();
    self._playheadLineAnimation = null;
  }

  if (!self._useAnimation) {
    return;
  }

  let lastPlayheadPosition = null;

  self._playheadLineAnimation = new Animation(function() {
    const time = self._player.getCurrentTime();
    const playheadPosition = self._view.timeToPixels(time);

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

PlayheadLayer.prototype.getPlayheadPixel = function() {
  return this._playheadPixel;
};

PlayheadLayer.prototype.showPlayheadTime = function(show) {
  if (show) {
    if (!this._playheadText) {
      // Create it
      this._createPlayheadText(this._playheadTextColor,
        this._playheadBackgroundColor, this._playheadPadding);
      this.fitToView();
    }
  }
  else {
    if (this._playheadText) {
      this._playheadText.remove();
      this._playheadText.destroy();
      this._playheadText = null;
    }
  }
};

PlayheadLayer.prototype.updatePlayheadText = function() {
  if (this._playheadText) {
    const time = this._player.getCurrentTime();
    const text = this._view.formatTime(time);

    this._playheadText.setText(text);
  }
};

PlayheadLayer.prototype.destroy = function() {
  if (this._playheadLineAnimation) {
    this._playheadLineAnimation.stop();
    this._playheadLineAnimation = null;
  }
};

export default PlayheadLayer;
