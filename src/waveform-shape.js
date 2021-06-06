/**
 * @file
 *
 * Defines the {@link WaveformShape} class.
 *
 * @module waveform-shape
 */

import { clamp, isLinearGradientColor, isString } from './utils';
import Konva from 'konva/lib/Core';

/**
 * Waveform shape options.
 *
 * @typedef {Object} WaveformShapeOptions
 * @global
 * @property {String | LinearGradientColor} color Waveform color.
 * @property {WaveformOverview|WaveformZoomView} view The view object
 *   that contains the waveform shape.
 * @property {Segment?} segment If given, render a waveform image
 *   covering the segment's time range. Otherwise, render the entire
 *   waveform duration.
 */

/**
 * Creates a Konva.Shape object that renders a waveform image.
 *
 * @class
 * @alias WaveformShape
 *
 * @param {WaveformShapeOptions} options
 */

function WaveformShape(options) {
  this._color = options.color;

  var shapeOptions = {};

  if (isString(options.color)) {
    shapeOptions.fill = options.color;
  }
  else if (isLinearGradientColor(options.color)) {
    var startY = options.view._height * (options.color.linearGradientStart / 100);
    var endY = options.view._height * (options.color.linearGradientEnd / 100);

    shapeOptions.fillLinearGradientStartPointY = startY;
    shapeOptions.fillLinearGradientEndPointY = endY;
    shapeOptions.fillLinearGradientColorStops = [
      0, options.color.linearGradientColorStops[0],
      1, options.color.linearGradientColorStops[1]
    ];
  }
  else {
    throw new TypeError('Unknown type for color property');
  }

  this._shape = new Konva.Shape(shapeOptions);
  this._view = options.view;
  this._segment = options.segment;

  this._shape.sceneFunc(this._sceneFunc.bind(this));
  this._shape.hitFunc(this._waveformShapeHitFunc.bind(this));
}

// WaveformShape.prototype = Object.create(Konva.Shape.prototype);

WaveformShape.prototype.setSegment = function(segment) {
  this._segment = segment;
};

WaveformShape.prototype.setWaveformColor = function(color) {
  if (isString(color)) {
    this._shape.fill(color);

    this._shape.fillLinearGradientStartPointY(null);
    this._shape.fillLinearGradientEndPointY(null);
    this._shape.fillLinearGradientColorStops(null);
  }
  else if (isLinearGradientColor(color)) {
    this._shape.fill(null);

    var startY = this._view._height * (color.linearGradientStart / 100);
    var endY = this._view._height * (color.linearGradientEnd / 100);

    this._shape.fillLinearGradientStartPointY(startY);
    this._shape.fillLinearGradientEndPointY(endY);
    this._shape.fillLinearGradientColorStops([
      0, color.linearGradientColorStops[0],
      1, color.linearGradientColorStops[1]
    ]);
  }
  else {
    throw new TypeError('Unknown type for color property');
  }
};

WaveformShape.prototype.fitToView = function() {
  this.setWaveformColor(this._color);
};

WaveformShape.prototype._sceneFunc = function(context) {
  var frameOffset = this._view.getFrameOffset();
  var width = this._view.getWidth();
  var height = this._view.getHeight();

  this._drawWaveform(
    context,
    this._view.getWaveformData(),
    frameOffset,
    this._segment ? this._view.timeToPixels(this._segment.startTime) : frameOffset,
    this._segment ? this._view.timeToPixels(this._segment.endTime)   : frameOffset + width,
    width,
    height
  );
};

/**
 * Draws a waveform on a canvas context.
 *
 * @param {Konva.Context} context The canvas context to draw on.
 * @param {WaveformData} waveformData The waveform data to draw.
 * @param {Number} frameOffset The start position of the waveform shown
 *   in the view, in pixels.
 * @param {Number} startPixels The start position of the waveform to draw,
 *   in pixels.
 * @param {Number} endPixels The end position of the waveform to draw,
 *   in pixels.
 * @param {Number} width The width of the waveform area, in pixels.
 * @param {Number} height The height of the waveform area, in pixels.
 */

WaveformShape.prototype._drawWaveform = function(context, waveformData,
    frameOffset, startPixels, endPixels, width, height) {
  if (startPixels < frameOffset) {
    startPixels = frameOffset;
  }

  var limit = frameOffset + width;

  if (endPixels > limit) {
    endPixels = limit;
  }

  if (endPixels > waveformData.length - 1) {
    endPixels = waveformData.length - 1;
  }

  var channels = waveformData.channels;

  var waveformTop = 0;
  var waveformHeight = Math.floor(height / channels);

  for (var i = 0; i < channels; i++) {
    if (i === channels - 1) {
      waveformHeight = height - (channels - 1) * waveformHeight;
    }

    this._drawChannel(
      context,
      waveformData.channel(i),
      frameOffset,
      startPixels,
      endPixels,
      waveformTop,
      waveformHeight
    );

    waveformTop += waveformHeight;
  }
};

/**
 * Draws a single waveform channel on a canvas context.
 *
 * @param {Konva.Context} context The canvas context to draw on.
 * @param {WaveformDataChannel} channel The waveform data to draw.
 * @param {Number} frameOffset The start position of the waveform shown
 *   in the view, in pixels.
 * @param {Number} startPixels The start position of the waveform to draw,
 *   in pixels.
 * @param {Number} endPixels The end position of the waveform to draw,
 *   in pixels.
 * @param {Number} top The top of the waveform channel area, in pixels.
 * @param {Number} height The height of the waveform channel area, in pixels.
 */

WaveformShape.prototype._drawChannel = function(context, channel,
    frameOffset, startPixels, endPixels, top, height) {
  var x, amplitude;

  var amplitudeScale = this._view.getAmplitudeScale();

  var lineX, lineY;

  context.beginPath();

  for (x = startPixels; x <= endPixels; x++) {
    amplitude = channel.min_sample(x);

    lineX = x - frameOffset + 0.5;
    lineY = top + WaveformShape.scaleY(amplitude, height, amplitudeScale) + 0.5;

    context.lineTo(lineX, lineY);
  }

  for (x = endPixels; x >= startPixels; x--) {
    amplitude = channel.max_sample(x);

    lineX = x - frameOffset + 0.5;
    lineY = top + WaveformShape.scaleY(amplitude, height, amplitudeScale) + 0.5;

    context.lineTo(lineX, lineY);
  }

  context.closePath();

  context.fillShape(this._shape);
};

WaveformShape.prototype._waveformShapeHitFunc = function(context) {
  if (!this._segment) {
    return;
  }

  var frameOffset = this._view.getFrameOffset();
  var viewWidth = this._view.getWidth();
  var viewHeight = this._view.getHeight();

  var startPixels = this._view.timeToPixels(this._segment.startTime);
  var endPixels   = this._view.timeToPixels(this._segment.endTime);

  var offsetY = 10;
  var hitRectHeight = viewHeight - 2 * offsetY;

  if (hitRectHeight < 0) {
    hitRectHeight = 0;
  }

  var hitRectLeft = startPixels - frameOffset;
  var hitRectWidth = endPixels - startPixels;

  if (hitRectLeft < 0) {
    hitRectWidth -= -hitRectLeft;
    hitRectLeft = 0;
  }

  if (hitRectLeft + hitRectWidth > viewWidth) {
    hitRectWidth -= hitRectLeft + hitRectWidth - viewWidth;
  }

  context.beginPath();
  context.rect(hitRectLeft, offsetY, hitRectWidth, hitRectHeight);
  context.closePath();
  context.fillStrokeShape(this._shape);
};

WaveformShape.prototype.addToLayer = function(layer) {
  layer.add(this._shape);
};

WaveformShape.prototype.destroy = function() {
  this._shape.destroy();
  this._shape = null;
};

WaveformShape.prototype.on = function(event, handler) {
  this._shape.on(event, handler);
};

/**
 * Scales the waveform data for drawing on a canvas context.
 *
 * @see {@link https://stats.stackexchange.com/questions/281162}
 *
 * @todo Assumes 8-bit waveform data (-128 to 127 range)
 *
 * @param {Number} amplitude The waveform data point amplitude.
 * @param {Number} height The height of the waveform, in pixels.
 * @param {Number} scale Amplitude scaling factor.
 * @returns {Number} The scaled waveform data point.
 */

WaveformShape.scaleY = function(amplitude, height, scale) {
  var y = -(height - 1) * (amplitude * scale + 128) / 255 + (height - 1);

  return clamp(Math.floor(y), 0, height - 1);
};

export default WaveformShape;
